import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/src/lib/supabase/server'

export async function GET() {
  try {
    // 1. Initialize the standard Supabase server client which handles cookies and sessions correctly
    const supabaseAuth = await createClient();
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Supabase URL/Key not set' }, { status: 500 });
    }

    // 2. Verify authenticated user is an ADMIN
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user || user.user_metadata?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Initialize admin service role client to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Fetch all system users (merchants) to map store metadata
    const { data: { users: authUsers }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Fetch addresses with governorate names
    const { data: addresses, error: addressesError } = await supabaseAdmin
      .from('addresses')
      .select('*, governorates(name_ar, name_en)');
    if (addressesError) throw addressesError;

    const addressesMap = new Map();
    if (addresses) {
      addresses.forEach(addr => {
        if (addr.is_default || !addressesMap.has(addr.user_id)) {
          addressesMap.set(addr.user_id, addr);
        }
      });
    }

    // Create a quick lookup map for store_id -> merchant metadata
    const merchantMap = new Map<string, {
      storeNameAr: string;
      storeNameEn: string;
      merchantName: string;
      merchantEmail: string;
      merchantPhone: string;
      commissionRate: number;
      address: any;
    }>();

    authUsers.forEach(u => {
      const metadata = u.user_metadata || {};
      const storeId = metadata.store_id;
      if (storeId) {
        const addr = addressesMap.get(u.id);
        merchantMap.set(storeId, {
          storeNameAr: metadata.store_name_ar || metadata.full_name || 'متجر وصال',
          storeNameEn: metadata.store_name_en || metadata.full_name || 'Wesal Store',
          merchantName: metadata.full_name || 'تاجر وصال',
          merchantEmail: u.email || '',
          merchantPhone: metadata.phone || u.phone || 'N/A',
          commissionRate: parseFloat(metadata.commission || '10'), // default to 10%
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
        });
      }
    });

    // 5. Fetch all orders with their items, products, and variants
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(*, product_images(*)),
          variant:product_variants(*, colors(*), sizes(*))
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // 6. Filter and Map orders
    const processedOrders = (orders || []).map(order => {
      const items = order.order_items || [];

      // Filter out items that have no store/merchant or whose product doesn't exist
      const validItems = items.filter((item: any) => {
        const storeId = item.products?.store_id;
        return storeId && merchantMap.has(storeId);
      }).map((item: any) => {
        const storeId = item.products?.store_id;
        const merchant = merchantMap.get(storeId)!;

        // Calculate commission dynamically if stored as 0 or null
        const price = item.price_at_time || item.unit_price || 0;
        const calculatedCommission = item.commission_amount || (price * item.quantity * (merchant.commissionRate / 100));

        return {
          ...item,
          commission_amount: calculatedCommission,
          merchant_details: {
            store_name_ar: merchant.storeNameAr,
            store_name_en: merchant.storeNameEn,
            merchant_name: merchant.merchantName,
            merchant_email: merchant.merchantEmail,
            merchant_phone: merchant.merchantPhone,
            commission_rate: merchant.commissionRate,
            address: merchant.address
          }
        };
      });

      // Recalculate order totals for filtered valid items only
      const validSubtotal = validItems.reduce((acc: number, item: any) => {
        const price = item.price_at_time || item.unit_price || 0;
        return acc + (price * item.quantity);
      }, 0);

      return {
        ...order,
        order_items: validItems,
        // Replace totals based on filtered items
        total_amount: validSubtotal,
        final_price: validSubtotal + Number(order.fixed_shipping_price || 0)
      };
    }).filter(order => order.order_items.length > 0); // Exclude orders with 0 valid items

    return NextResponse.json(processedOrders);
  } catch (err: any) {
    console.error('API Error in admin orders GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
