'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Trash2, Copy, CheckCircle, Clock, 
  AlertCircle, Loader2, RefreshCw, ToggleLeft, ToggleRight
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: '',
    min_order_value: '0',
    max_discount: '',
    usage_limit: '1',
    end_date: '',
    is_active: true,
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TUJ';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(prev => ({ ...prev, code }));
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupons(data.coupons || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.end_date) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: parseFloat(form.value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        used_count: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        is_active: form.is_active,
      };
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`تم إنشاء الكوبون "${payload.code}" بنجاح! ✅`);
      setShowForm(false);
      setForm({ code: '', type: 'PERCENTAGE', value: '', min_order_value: '0', max_discount: '', usage_limit: '1', end_date: '', is_active: true });
      fetchCoupons();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message.includes('unique') ? 'هذا الكود مستخدم بالفعل، اختر كوداً آخر' : err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
    });
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    await fetch('/api/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchCoupons();
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: 'معطل', color: 'bg-gray-100 text-gray-500' };
    if (coupon.end_date && new Date(coupon.end_date) < new Date()) return { label: 'منتهي الصلاحية', color: 'bg-red-100 text-red-600' };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return { label: 'استُنفد', color: 'bg-orange-100 text-orange-600' };
    return { label: 'نشط', color: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">إدارة أكواد الخصم</h1>
          <p className="text-gray-500 mt-1">إنشاء وإدارة كوبونات الخصم للعملاء</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchCoupons} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            إنشاء كوبون جديد
          </button>
        </div>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-green-700 font-semibold">
          <CheckCircle className="w-5 h-5 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-red-700 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ms-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-3">إنشاء كوبون خصم جديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Code */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">كود الخصم *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="مثال: SAVE20"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none font-mono uppercase text-lg font-bold tracking-widest"
                  required
                />
                <button type="button" onClick={generateCode} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-600 transition-colors whitespace-nowrap">
                  توليد تلقائي
                </button>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">نوع الخصم *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: 'PERCENTAGE' }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${form.type === 'PERCENTAGE' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
                >
                  نسبة مئوية (%)
                </button>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: 'FIXED' }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${form.type === 'FIXED' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
                >
                  مبلغ ثابت (ج.م)
                </button>
              </div>
            </div>

            {/* Value */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                قيمة الخصم * {form.type === 'PERCENTAGE' ? '(%)' : '(ج.م)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                placeholder={form.type === 'PERCENTAGE' ? '10' : '50'}
                min="1"
                max={form.type === 'PERCENTAGE' ? '100' : undefined}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none text-lg font-bold"
                required
              />
            </div>

            {/* Usage Limit */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">عدد مرات الاستخدام</label>
              <input
                type="number"
                value={form.usage_limit}
                onChange={e => setForm(p => ({ ...p, usage_limit: e.target.value }))}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
              />
              <p className="text-xs text-gray-400">اكتب 1 لاستخدام مرة واحدة فقط</p>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">تاريخ الانتهاء *</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                required
              />
            </div>

            {/* Min Order */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">الحد الأدنى للطلب (ج.م)</label>
              <input
                type="number"
                value={form.min_order_value}
                onChange={e => setForm(p => ({ ...p, min_order_value: e.target.value }))}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
              />
            </div>

            {/* Max Discount (only for percentage) */}
            {form.type === 'PERCENTAGE' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">الحد الأقصى للخصم (ج.م) — اختياري</label>
                <input
                  type="number"
                  value={form.max_discount}
                  onChange={e => setForm(p => ({ ...p, max_discount: e.target.value }))}
                  placeholder="مثال: 100"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                />
              </div>
            )}

            {/* Submit */}
            <div className="md:col-span-2 flex gap-4 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-base hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإنشاء...</> : <><Plus className="w-5 h-5" /> إنشاء الكوبون</>}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            الكوبونات الحالية ({coupons.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-gray-400">جاري التحميل...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">لا توجد كوبونات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                <tr>
                  <th className="px-6 py-4 text-right">الكود</th>
                  <th className="px-6 py-4 text-right">الخصم</th>
                  <th className="px-6 py-4 text-right">الاستخدام</th>
                  <th className="px-6 py-4 text-right">الحد الأدنى</th>
                  <th className="px-6 py-4 text-right">تاريخ الانتهاء</th>
                  <th className="px-6 py-4 text-right">الحالة</th>
                  <th className="px-6 py-4 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(coupon => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-gray-900 text-sm tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyCoupon(coupon.code)}
                            className="text-gray-400 hover:text-primary transition-colors"
                            title="نسخ الكود"
                          >
                            {copied === coupon.code ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-lg text-primary">
                          {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `${coupon.value} ج.م`}
                        </span>
                        {coupon.max_discount && (
                          <span className="text-xs text-gray-400 block">حد أقصى {coupon.max_discount} ج.م</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[60px]">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: coupon.usage_limit ? `${Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)}%` : '0%' }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600 whitespace-nowrap">
                            {coupon.used_count} / {coupon.usage_limit ?? '∞'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {coupon.min_order_value > 0 ? `${coupon.min_order_value} ج.م` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {coupon.end_date ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(coupon.end_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(coupon)}
                            className="text-gray-400 hover:text-primary transition-colors"
                            title={coupon.is_active ? 'تعطيل' : 'تفعيل'}
                          >
                            {coupon.is_active
                              ? <ToggleRight className="w-6 h-6 text-primary" />
                              : <ToggleLeft className="w-6 h-6" />}
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
