'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, User, MapPin, Loader2, Save, 
  AlertCircle, CheckCircle, Phone, Mail
} from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

interface Governorate {
  id: string;
  name_ar: string;
  name_en: string;
}

export default function MerchantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [governorates, setGovernorates] = useState<Governorate[]>([]);

  // Merchant info state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    store_name_ar: '',
    store_name_en: '',
    commission_rate: 10
  });

  // Address info state
  const [address, setAddress] = useState({
    id: '', // Empty if no address exists yet
    governorate_id: '',
    city: '',
    street: '',
    building: '',
    floor: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      // 1. Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يرجى تسجيل الدخول أولاً');

      // 2. Fetch governorates
      const { data: govData } = await supabase.from('governorates').select('id, name_ar, name_en').order('name_ar');
      if (govData) setGovernorates(govData);

      // Set profile from auth metadata
      setProfile({
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        store_name_ar: user.user_metadata?.store_name_ar || '',
        store_name_en: user.user_metadata?.store_name_en || '',
        commission_rate: user.user_metadata?.commission_rate || 10
      });

      // 3. Fetch default address
      const { data: addrData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();

      if (addrData) {
        setAddress({
          id: addrData.id,
          governorate_id: addrData.governorate_id || '',
          city: addrData.city || '',
          street: addrData.street || '',
          building: addrData.building || '',
          floor: addrData.floor || '',
          notes: addrData.notes || ''
        });
      } else if (govData && govData.length > 0) {
        setAddress(prev => ({ ...prev, governorate_id: govData[0].id }));
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يرجى تسجيل الدخول أولاً');

      // 1. Update user auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.name,
          phone: profile.phone,
          store_name_ar: profile.store_name_ar,
          store_name_en: profile.store_name_en
        }
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name,
          phone: profile.phone
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // 3. Update or insert default address
      if (address.id) {
        const { error: addrError } = await supabase
          .from('addresses')
          .update({
            governorate_id: address.governorate_id,
            city: address.city,
            street: address.street,
            building: address.building,
            floor: address.floor,
            notes: address.notes
          })
          .eq('id', address.id);
        if (addrError) throw addrError;
      } else {
        const { data: newAddr, error: addrError } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            governorate_id: address.governorate_id,
            city: address.city,
            street: address.street,
            building: address.building,
            floor: address.floor,
            notes: address.notes,
            is_default: true
          })
          .select()
          .single();
        
        if (addrError) throw addrError;
        if (newAddr) setAddress(prev => ({ ...prev, id: newAddr.id }));
      }

      setSuccess('تم تحديث بيانات المتجر وعنوان الشحن بنجاح! 🛍️🚚');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="font-semibold">جاري تحميل إعدادات المتجر...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">إعدادات المتجر والعناوين</h1>
        <p className="text-gray-500 mt-1">إدارة هوية المتجر الخاص بك، وتحديد تفاصيل العنوان لشركات الشحن واستلام المنتجات</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-green-700 font-semibold shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 font-semibold shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Profile & Store Settings */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            بيانات التاجر والمتجر
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name AR */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">اسم المتجر بالعربية *</label>
              <input
                type="text"
                value={profile.store_name_ar}
                onChange={e => setProfile(p => ({ ...p, store_name_ar: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold text-gray-800"
                required
              />
            </div>

            {/* Store Name EN */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">اسم المتجر بالإنجليزية *</label>
              <input
                type="text"
                value={profile.store_name_en}
                onChange={e => setProfile(p => ({ ...p, store_name_en: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold text-gray-800"
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">اسم التاجر المسؤول *</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold text-gray-800"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">رقم الهاتف للتواصل *</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold text-gray-800"
                  required
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">البريد الإلكتروني (غير قابل للتعديل)</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 outline-none cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Commission Rate (Read Only) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">عمولة المنصة الحالية (%)</label>
              <input
                type="text"
                value={`${profile.commission_rate}%`}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 outline-none cursor-not-allowed font-bold"
              />
            </div>
          </div>
        </div>

        {/* 2. Pickup Address Settings */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            عنوان الاستلام (Pickup Address) لشركات الشحن
          </h2>
          <p className="text-xs text-gray-400 font-medium -mt-2">يرجى كتابة عنوانك بدقة متناهية، حيث ستقوم شركة الشحن بالتوجه لهذا العنوان لاستلام المنتجات وتوصيلها للعملاء.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Governorate */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">المحافظة *</label>
              <select
                value={address.governorate_id}
                onChange={e => setAddress(p => ({ ...p, governorate_id: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white font-semibold text-gray-800"
                required
              >
                {governorates.map(gov => (
                  <option key={gov.id} value={gov.id}>{gov.name_ar}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">المدينة / المنطقة *</label>
              <input
                type="text"
                value={address.city}
                onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                placeholder="مثال: مدينة نصر"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold text-gray-850"
                required
              />
            </div>

            {/* Street */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">الشارع *</label>
              <input
                type="text"
                value={address.street}
                onChange={e => setAddress(p => ({ ...p, street: e.target.value }))}
                placeholder="مثال: شارع عباس العقاد"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold"
                required
              />
            </div>

            {/* Building */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">رقم / اسم المبنى *</label>
              <input
                type="text"
                value={address.building}
                onChange={e => setAddress(p => ({ ...p, building: e.target.value }))}
                placeholder="مثال: عمارة 45"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold"
                required
              />
            </div>

            {/* Floor */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">الدور / الشقة</label>
              <input
                type="text"
                value={address.floor}
                onChange={e => setAddress(p => ({ ...p, floor: e.target.value }))}
                placeholder="مثال: الدور الثالث شقة 12"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">علامة مميزة / تفاصيل إضافية</label>
              <input
                type="text"
                value={address.notes}
                onChange={e => setAddress(p => ({ ...p, notes: e.target.value }))}
                placeholder="مثال: خلف أولاد رجب"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-base hover:bg-primary/90 transition-all disabled:opacity-60 shadow-md shadow-primary/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ التغييرات بالكامل
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
