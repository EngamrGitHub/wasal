'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Edit3, Check, X, ShieldAlert, Award } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { useLocale } from 'next-intl';

export default function AdminSettingsPage() {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [govLoading, setGovLoading] = useState(true);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [editingGovId, setEditingGovId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Governorates Shipping Rates
  const loadGovernorates = async () => {
    try {
      setGovLoading(true);
      const supabase = createClient() as any;
      if (!supabase) return;

      const { data, error } = await supabase
        .from('governorates')
        .select('*')
        .order(locale === 'ar' ? 'name_ar' : 'name_en');

      if (data) {
        setGovernorates(data);
      }
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(locale === 'ar' ? 'فشل تحميل أسعار المحافظات.' : 'Failed to load shipping rates.');
    } finally {
      setGovLoading(false);
    }
  };

  useEffect(() => {
    loadGovernorates();
  }, [locale]);

  const handleStartEdit = (gov: any) => {
    setEditingGovId(gov.id);
    setEditingPrice(Number(gov.shipping_price || 0));
  };

  const handleSavePrice = async (govId: string) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const supabase = createClient() as any;
      if (!supabase) throw new Error('Supabase client missing');

      const { error } = await supabase
        .from('governorates')
        .update({ shipping_price: editingPrice })
        .eq('id', govId);

      if (error) throw error;

      setSuccessMsg(locale === 'ar' ? 'تم تحديث سعر الشحن بنجاح!' : 'Shipping rate updated successfully!');
      setEditingGovId(null);
      loadGovernorates(); // reload data
    } catch (err: any) {
      console.error(err);
      setErrorMsg(locale === 'ar' ? 'فشل حفظ التعديل.' : 'Failed to save shipping rate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">
            {locale === 'ar' ? 'الإعدادات العامة للتحكم' : 'System Settings'}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === 'ar' 
              ? 'إدارة خيارات وتفضيلات المنصة وضبط تعريفات وأسعار شحن شركة Jet Express.' 
              : 'Manage store configurations and adjust Jet Express shipping rates globally.'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-success/10 border border-success/20 text-success text-sm font-semibold rounded-2xl">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-error/10 border border-error/20 text-error text-sm font-semibold rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* Shipping Rates Manager Card (Dynamic Table) */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'ar' ? 'لوحة أسعار شحن المحافظات (Jet Express)' : 'Governorates Shipping Price Manager'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === 'ar' ? 'تحرير وتعديل أسعار الشحن الموحدة للعملاء.' : 'Modify standard customer shipping pricing in real-time.'}
              </p>
            </div>
          </div>
        </div>

        {govLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4 text-start">{locale === 'ar' ? 'المحافظة' : 'Governorate'}</th>
                  <th className="px-6 py-4 text-start">{locale === 'ar' ? 'رمز التعريف' : 'Locale Code'}</th>
                  <th className="px-6 py-4 text-start">{locale === 'ar' ? 'سعر الشحن الحالي (EGP)' : 'Shipping Rate (EGP)'}</th>
                  <th className="px-6 py-4 text-end">{locale === 'ar' ? 'التحكم' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {governorates.map((gov) => {
                  const isEditing = editingGovId === gov.id;
                  return (
                    <tr key={gov.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 text-start">
                        {locale === 'ar' ? gov.name_ar : gov.name_en}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs text-start">
                        {gov.name_en.toUpperCase().slice(0, 3)}
                      </td>
                      <td className="px-6 py-4 text-start">
                        {isEditing ? (
                          <div className="relative flex items-center w-32">
                            <input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(Number(e.target.value))}
                              className="w-full h-10 px-3 rounded-lg border-2 border-primary/20 focus:border-primary focus:outline-none font-bold text-gray-900"
                            />
                            <span className={`absolute ${locale === 'ar' ? 'left-3' : 'right-3'} text-xs font-bold text-gray-400`}>EGP</span>
                          </div>
                        ) : (
                          <span className="font-black text-gray-900 text-lg bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            {gov.shipping_price || '0.00'} EGP
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-end">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSavePrice(gov.id)}
                              disabled={loading}
                              className="bg-success text-white p-2 rounded-lg hover:bg-success/90 transition shadow-sm"
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingGovId(null)}
                              className="bg-gray-100 text-gray-500 p-2 rounded-lg hover:bg-gray-200 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(gov)}
                            className="text-primary hover:text-white border border-primary/20 hover:bg-primary px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {locale === 'ar' ? 'تعديل السعر' : 'Edit Price'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* General Settings Cards */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-foreground">
            {locale === 'ar' ? 'المعلومات العامة للمتجر' : 'General Store Information'}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{locale === 'ar' ? 'اسم المتجر' : 'Store Name'}</label>
              <input type="text" defaultValue="Tujaria" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{locale === 'ar' ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}</label>
              <input type="email" defaultValue="admin@tujaria.com" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
