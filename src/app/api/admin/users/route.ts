import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - List all users (customers, merchants, admins) using auth.admin and join addresses
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    // Fetch auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch addresses with governorate names
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*, governorates(name_ar, name_en)');

    const addressesMap = new Map();
    if (addresses) {
      addresses.forEach(addr => {
        addressesMap.set(addr.user_id, addr);
      });
    }

    const mappedUsers = users.map(u => {
      const addr = addressesMap.get(u.id);
      return {
        id: u.id,
        name: u.user_metadata?.full_name || 'مستخدم وصال',
        email: u.email,
        role: u.user_metadata?.role || 'CUSTOMER',
        phone: u.user_metadata?.phone || '',
        created_at: u.created_at,
        store_id: u.user_metadata?.store_id || null,
        store_name_ar: u.user_metadata?.store_name_ar || '',
        store_name_en: u.user_metadata?.store_name_en || '',
        commission_rate: u.user_metadata?.commission_rate || 10,
        address: addr ? {
          governorate_id: addr.governorate_id || '',
          governorate_name_ar: addr.governorates?.name_ar || '',
          governorate_name_en: addr.governorates?.name_en || '',
          city: addr.city || '',
          street: addr.street || '',
          building: addr.building || '',
          floor: addr.floor || '',
          notes: addr.notes || ''
        } : null
      };
    });

    return NextResponse.json({ users: mappedUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create a new user (especially merchant) with address details
export async function POST(request: Request) {
  try {
    const { 
      email, password, name, phone, role, 
      store_name_ar, store_name_en, commission_rate,
      governorate_id, city, street, building, floor, notes
    } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'البريد الإلكتروني، كلمة المرور، والاسم مطلوبين' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    const isMerchant = role === 'MERCHANT';
    const storeId = isMerchant ? crypto.randomUUID() : null;

    // 1. Create auth user with metadata
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role || 'CUSTOMER',
        full_name: name,
        phone: phone || '',
        store_id: storeId,
        store_name_ar: isMerchant ? (store_name_ar || name) : '',
        store_name_en: isMerchant ? (store_name_en || name) : '',
        commission_rate: parseFloat(commission_rate) || 10
      }
    });

    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || 'فشل إنشاء المستخدم' }, { status: 400 });
    }

    // 2. Insert into profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: name,
        phone: phone || ''
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Insert address if governorate_id is provided
    if (governorate_id) {
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          governorate_id,
          city: city || '',
          street: street || '',
          building: building || '',
          floor: floor || '',
          notes: notes || '',
          is_default: true
        });

      if (addressError) {
        console.error('Failed to create merchant address:', addressError.message);
      }
    }

    return NextResponse.json({ success: true, userId: user.id, storeId });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update an existing user's details and address
export async function PATCH(request: Request) {
  try {
    const { 
      id, name, phone, role, 
      store_name_ar, store_name_en, commission_rate,
      governorate_id, city, street, building, floor, notes
    } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'معرف المستخدم والاسم مطلوبين' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    // Fetch existing user to preserve store_id
    const { data: { user: existingUser }, error: getUserError } = await supabase.auth.admin.getUserById(id);
    if (getUserError || !existingUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const isMerchant = role === 'MERCHANT';
    const existingStoreId = existingUser.user_metadata?.store_id;
    const storeId = isMerchant ? (existingStoreId || crypto.randomUUID()) : null;

    // 1. Update auth user metadata & role
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: {
        role: role || 'CUSTOMER',
        full_name: name,
        phone: phone || '',
        store_id: storeId,
        store_name_ar: isMerchant ? (store_name_ar || name) : '',
        store_name_en: isMerchant ? (store_name_en || name) : '',
        commission_rate: parseFloat(commission_rate) || 10
      }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    // 2. Update profiles table
    await supabase.from('profiles')
      .update({
        full_name: name,
        phone: phone || ''
      })
      .eq('id', id);

    // 3. Update or Insert address if governorate_id is provided
    if (governorate_id) {
      const { data: existingAddress } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', id)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();

      if (existingAddress) {
        // Update existing address
        await supabase.from('addresses')
          .update({
            governorate_id,
            city: city || '',
            street: street || '',
            building: building || '',
            floor: floor || '',
            notes: notes || ''
          })
          .eq('id', existingAddress.id);
      } else {
        // Insert new address
        await supabase.from('addresses')
          .insert({
            user_id: id,
            governorate_id,
            city: city || '',
            street: street || '',
            building: building || '',
            floor: floor || '',
            notes: notes || '',
            is_default: true
          });
      }
    } else {
      // If role is no longer merchant or no address, we can optional remove or keep default
    }

    return NextResponse.json({ success: true, storeId });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete a user
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    // Delete profiles and addresses first
    await supabase.from('addresses').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);

    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
