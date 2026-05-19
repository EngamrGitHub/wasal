'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, Mail, Lock, Phone, MapPin, Edit,
  Store, Shield, Loader2, RefreshCw, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

interface Governorate {
  id: string;
  name_ar: string;
  name_en: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MERCHANT' | 'CUSTOMER';
  phone: string;
  created_at: string;
  store_id: string | null;
  store_name_ar: string;
  store_name_en: string;
  commission_rate: number;
  address: {
    governorate_id: string;
    governorate_name_ar: string;
    governorate_name_en: string;
    city: string;
    street: string;
    building: string;
    floor: string;
    notes: string;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '', // Only for creation
    phone: '',
    role: 'MERCHANT' as 'MERCHANT' | 'CUSTOMER' | 'ADMIN',
    store_name_ar: '',
    store_name_en: '',
    commission_rate: '10',
    // Address fields
    governorate_id: '',
    city: '',
    street: '',
    building: '',
    floor: '',
    notes: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGovernorates = async () => {
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase.from('governorates').select('id, name_ar, name_en').order('name_ar');
      if (data) {
        setGovernorates(data);
        if (data.length > 0 && !form.governorate_id) {
          setForm(p => ({ ...p, governorate_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching governorates:', err);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchGovernorates();
  }, []);

  const handleEditClick = (user: UserItem) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '', // No password on edit
      phone: user.phone,
      role: user.role,
      store_name_ar: user.store_name_ar || '',
      store_name_en: user.store_name_en || '',
      commission_rate: String(user.commission_rate || '10'),
      governorate_id: user.address?.governorate_id || governorates[0]?.id || '',
      city: user.address?.city || '',
      street: user.address?.street || '',
      building: user.address?.building || '',
      floor: user.address?.floor || '',
      notes: user.address?.notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('يرجى ملء الاسم والبريد الإلكتروني');
      return;
    }
    if (!editingUser && !form.password) {
      setError('كلمة المرور مطلوبة للمستخدم الجديد');
      return;
    }

    setSubmitting(true);
    setError('');
    
    const isEdit = !!editingUser;
    const url = '/api/admin/users';
    const method = isEdit ? 'PATCH' : 'POST';
    const bodyPayload = isEdit ? { id: editingUser.id, ...form } : form;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(
        isEdit 
          ? `تم تحديث بيانات الحساب "${form.name}" بنجاح! ✏️✅`
          : `تم إنشاء حساب التاجر "${form.name}" ومتجره وعنوانه بنجاح! 🛍️🚚`
      );
      
      setShowForm(false);
      setEditingUser(null);
      setForm({
        name: '', email: '', password: '', phone: '',
        role: 'MERCHANT', store_name_ar: '', store_name_en: '', commission_rate: '10',
        governorate_id: governorates[0]?.id || '', city: '', street: '', building: '', floor: '', notes: ''
      });
      fetchUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحساب "${name}" نهائياً؟`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setSuccess('تم حذف الحساب بنجاح ✅');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">إدارة المستخدمين والتجار</h1>
          <p className="text-gray-500 mt-1">تعديل بيانات المستخدمين، إنشاء تجار جدد، وإسناد العمولات وعناوين الاستلام</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchUsers} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setForm({
                name: '', email: '', password: '', phone: '',
                role: 'MERCHANT', store_name_ar: '', store_name_en: '', commission_rate: '10',
                governorate_id: governorates[0]?.id || '', city: '', street: '', building: '', floor: '', notes: ''
              });
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            {showForm && !editingUser ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm && !editingUser ? 'إغلاق النموذج' : 'إنشاء حساب تاجر جديد'}
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
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

      {/* Create / Edit User Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
            {editingUser ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            {editingUser ? `تعديل بيانات الحساب: ${editingUser.name}` : 'بيانات التاجر والمتجر والشركاء (الشحن)'}
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">اسم المستخدم / التاجر بالكامل *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: أحمد محمد"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">البريد الإلكتروني للتاجر *</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="merchant@example.com"
                    disabled={!!editingUser}
                    className={`w-full pr-12 pl-4 py-3 rounded-xl border outline-none ${
                      editingUser 
                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'border-gray-200 focus:border-primary'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Password - Only show when creating */}
              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">كلمة المرور *</label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                      required={!editingUser}
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رقم الهاتف *</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="010XXXXXXXX"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              {/* Store Name AR */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">اسم المتجر (بالعربية) *</label>
                <div className="relative">
                  <Store className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={form.store_name_ar}
                    onChange={e => setForm(p => ({ ...p, store_name_ar: e.target.value }))}
                    placeholder="مثال: أزياء الشرق"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    required={form.role === 'MERCHANT'}
                  />
                </div>
              </div>

              {/* Store Name EN */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">اسم المتجر (بالانجليزية) *</label>
                <div className="relative">
                  <Store className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={form.store_name_en}
                    onChange={e => setForm(p => ({ ...p, store_name_en: e.target.value }))}
                    placeholder="Example: Al Sharq Fashion"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    required={form.role === 'MERCHANT'}
                  />
                </div>
              </div>

              {/* Commission Rate */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">نسبة عمولة المنصة (%)</label>
                <input
                  type="number"
                  value={form.commission_rate}
                  onChange={e => setForm(p => ({ ...p, commission_rate: e.target.value }))}
                  placeholder="10"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">صلاحية الحساب</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white font-semibold text-gray-700"
                >
                  <option value="MERCHANT">تاجر (Merchant)</option>
                  <option value="ADMIN">مدير النظام (Admin)</option>
                  <option value="CUSTOMER">عميل عادي (Customer)</option>
                </select>
              </div>
            </div>

            {/* Address Information Section */}
            {form.role === 'MERCHANT' && (
              <div className="bg-gray-50/50 rounded-2xl p-6 border border-dashed border-gray-200 space-y-4">
                <h3 className="text-md font-black text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  عنوان الاستلام الخاص بالتاجر (لشركة الشحن)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Governorate */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">المحافظة *</label>
                    <select
                      value={form.governorate_id}
                      onChange={e => setForm(p => ({ ...p, governorate_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white font-semibold text-gray-700"
                      required
                    >
                      {governorates.map(gov => (
                        <option key={gov.id} value={gov.id}>{gov.name_ar}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">المدينة / المنطقة *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="مثال: التجمع الخامس"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                      required
                    />
                  </div>

                  {/* Street */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">اسم الشارع *</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
                      placeholder="مثال: شارع التسعين الشمالي"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                      required
                    />
                  </div>

                  {/* Building */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">رقم / اسم المبنى *</label>
                    <input
                      type="text"
                      value={form.building}
                      onChange={e => setForm(p => ({ ...p, building: e.target.value }))}
                      placeholder="مثال: فيلا 56أ أو عمارة الروضة"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                      required
                    />
                  </div>

                  {/* Floor */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">الدور / الشقة</label>
                    <input
                      type="text"
                      value={form.floor}
                      onChange={e => setForm(p => ({ ...p, floor: e.target.value }))}
                      placeholder="مثال: الدور الأول - شقة 2"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">تفاصيل إضافية للعنوان</label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="مثال: بجوار مسجد الحق"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-base hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-primary/10"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
                ) : editingUser ? (
                  <><Edit className="w-5 h-5" /> حفظ التعديلات</>
                ) : (
                  <><Plus className="w-5 h-5" /> إنشاء حساب التاجر</>
                )}
              </button>
              <button
                type="button"
                onClick={() => { 
                  setShowForm(false); 
                  setEditingUser(null);
                  setError(''); 
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            المستخدمين والتجار المسجلين ({users.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-gray-400">جاري تحميل قائمة المستخدمين...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">لا يوجد مستخدمون مسجلون بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                <tr>
                  <th className="px-6 py-4 text-right">الاسم بالكامل</th>
                  <th className="px-6 py-4 text-right">البريد الإلكتروني</th>
                  <th className="px-6 py-4 text-right">الدور</th>
                  <th className="px-6 py-4 text-right">اسم المتجر</th>
                  <th className="px-6 py-4 text-right">عنوان الاستلام (الشحن)</th>
                  <th className="px-6 py-4 text-right">العمولة</th>
                  <th className="px-6 py-4 text-right">رقم الهاتف</th>
                  <th className="px-6 py-4 text-right">تاريخ التسجيل</th>
                  <th className="px-6 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 w-fit ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'MERCHANT' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'ADMIN' ? <Shield className="w-3.5 h-3.5" /> : null}
                        {user.role === 'MERCHANT' ? <Store className="w-3.5 h-3.5" /> : null}
                        {user.role === 'ADMIN' ? 'مدير النظام' : user.role === 'MERCHANT' ? 'تاجر' : 'عميل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                      {user.role === 'MERCHANT' ? (user.store_name_ar || 'متجر وصال') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'MERCHANT' && user.address ? (
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p className="font-bold text-primary">{user.address.governorate_name_ar} - {user.address.city}</p>
                          <p className="text-gray-500 font-medium">{user.address.street}، {user.address.building}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      {user.role === 'MERCHANT' ? `${user.commission_rate}%` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-semibold">
                      {user.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-gray-400 hover:text-primary transition-colors p-1"
                          title="تعديل المستخدم"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
