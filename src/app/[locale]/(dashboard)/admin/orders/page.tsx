'use client';

import React, { useEffect, useState } from 'react';
import { Column, DataTable } from '@/src/components/admin/DataTable';
import { useTranslations, useLocale } from 'next-intl';
import { 
  ShoppingBag, Calendar, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Coins, User, Phone, Mail, Store, ChevronLeft, ChevronRight
} from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { Loader } from '@/src/components/ui/Loader';

interface AdminOrderView {
  id: string;
  user_id: string;
  total_amount: number;
  final_price: number;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipping_address: any;
  created_at: string;
  fixed_shipping_price?: number;
  order_items: {
    id: string;
    quantity: number;
    unit_price?: number;
    price_at_time?: number;
    commission_amount?: number;
    products: {
      name_ar: string;
      name_en: string;
      images?: string[];
      product_images?: { image_url: string }[];
    };
    variant: {
      sku: string | null;
      image_url: string | null;
      colors?: { name: string; hex_code: string } | null;
      sizes?: { name: string } | null;
    } | null;
    merchant_details: {
      store_name_ar: string;
      store_name_en: string;
      merchant_name: string;
      merchant_email: string;
      merchant_phone: string;
      commission_rate: number;
      address?: {
        governorate_id: string;
        governorate_name_ar: string;
        governorate_name_en: string;
        city: string;
        street: string;
        building: string;
        floor: string;
        notes: string;
      } | null;
    };
  }[];
}

export default function AdminOrdersPage() {
  const t = useTranslations('Admin.Orders');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  const [orders, setOrders] = useState<AdminOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data || []);
      setCurrentPage(1); // Reset page on refresh
    } catch (err: any) {
      console.error('Error fetching admin orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      setError(null);
      setSuccess(null);

      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update local state immediately
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      setSuccess(locale === 'ar' ? 'تم تحديث حالة الطلب بنجاح! 📦✅' : 'Order status updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculate total platform commissions from all orders
  const totalPlatformCommissions = orders.reduce((acc, order) => {
    const items = order.order_items || [];
    const orderComm = items.reduce((sum, item) => sum + (item.commission_amount || 0), 0);
    return acc + orderComm;
  }, 0);

  // Paginated Orders Slicing
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const columns: Column<AdminOrderView>[] = [
    { 
      header: t('columns.order_id') || 'Order ID', 
      accessorKey: 'id',
      cell: (item) => (
        <div className="flex flex-col text-start">
          <span className="text-xs text-gray-400 font-mono">{(item.id || '').slice(0, 8)}...</span>
          <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(item.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      )
    },
    { 
      header: locale === 'ar' ? 'بيانات العميل الشحن 🔒' : 'Customer & Shipping (Admin Only) 🔒', 
      accessorKey: 'shipping_address',
      cell: (item) => {
        let cust = { name: 'Guest Customer', phone: 'N/A', address: 'N/A', governorate: '' };
        if (item.shipping_address) {
          try {
            if (typeof item.shipping_address === 'object') {
              cust = item.shipping_address as any;
            } else {
              cust = JSON.parse(item.shipping_address);
            }
          } catch (e) {
            cust.name = locale === 'ar' ? 'عميل زائر' : 'Guest Customer';
          }
        }
        return (
          <div className="flex flex-col text-xs text-start space-y-1 bg-primary/5 p-3 rounded-2xl border border-primary/10 max-w-[280px]">
            <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary shrink-0" />
              {cust.name}
            </span>
            <a href={`tel:${cust.phone}`} className="text-primary hover:underline font-bold flex items-center gap-1 font-mono text-sm">
              📞 {cust.phone}
            </a>
            <span className="text-[11px] text-gray-650 font-medium leading-relaxed mt-0.5">
              📍 {cust.governorate ? `${cust.governorate}: ` : ''}{cust.address}
            </span>
          </div>
        );
      }
    },
    {
      header: locale === 'ar' ? 'المنتجات المطلوبة والتجار بالتفصيل' : 'Products & Merchant details',
      accessorKey: 'order_items',
      cell: (item) => {
        const items = item.order_items || [];
        return (
          <div className="flex flex-col gap-3 text-start min-w-[320px]">
            {items.map((sub, i) => {
              const pTitle = locale === 'ar' 
                ? sub.products?.name_ar 
                : sub.products?.name_en;
              
              const m = sub.merchant_details;
              const storeName = locale === 'ar' ? m.store_name_ar : m.store_name_en;
              
              const colorName = sub.variant?.colors?.name;
              const colorHex = sub.variant?.colors?.hex_code;
              const sizeName = sub.variant?.sizes?.name;
              const defaultImg = sub.variant?.image_url
                || sub.products?.product_images?.find((img: any) => img.is_main)?.image_url
                || sub.products?.product_images?.[0]?.image_url
                || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100';

              return (
                <div key={i} className="text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col space-y-2">
                  {/* Product block */}
                  <div className="flex items-start gap-2.5">
                    <img src={defaultImg} alt={pTitle} className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-extrabold text-gray-900 leading-tight">{pTitle}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">SKU: {sub.variant?.sku || '—'}</span>
                    </div>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black ms-auto">
                      x{sub.quantity}
                    </span>
                  </div>

                  {/* Attributes */}
                  {(colorName || sizeName) && (
                    <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-2.5 bg-white p-1.5 rounded-lg border border-gray-50">
                      {colorName && (
                        <span className="flex items-center gap-1">
                          {colorHex && (
                            <span 
                              className="w-3 h-3 rounded-full border border-gray-200 shadow-sm inline-block" 
                              style={{ backgroundColor: colorHex }}
                            />
                          )}
                          {!colorHex && "🎨"} {colorName}
                        </span>
                      )}
                      {sizeName && <span className="flex items-center gap-1">📏 {sizeName}</span>}
                    </div>
                  )}

                  {/* Merchant details */}
                  <div className="bg-white p-2 rounded-xl border border-gray-100/80 flex flex-col space-y-1 text-[10px]">
                    <div className="font-extrabold text-primary flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span>{storeName}</span>
                    </div>
                    <div className="text-gray-500 flex items-center gap-1 font-semibold">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>{m.merchant_name}</span>
                    </div>
                    <div className="text-gray-500 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <a href={`tel:${m.merchant_phone}`} className="hover:underline">{m.merchant_phone}</a>
                    </div>
                    <div className="text-gray-500 flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span>{m.merchant_email}</span>
                    </div>
                    {m.address ? (
                      <div className="text-gray-500 flex items-start gap-1 font-semibold mt-1 pt-1 border-t border-gray-100/80">
                        <span className="shrink-0 text-primary">📍</span>
                        <span className="leading-tight">
                          {locale === 'ar' ? m.address.governorate_name_ar : m.address.governorate_name_en} - {m.address.city} - {m.address.street} - {m.address.building} {m.address.floor ? `, ${m.address.floor}` : ''} {m.address.notes ? `(${m.address.notes})` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="text-amber-600 flex items-start gap-1 font-semibold mt-1 pt-1 border-t border-gray-100/80">
                        <span className="shrink-0">📍</span>
                        <span>{locale === 'ar' ? 'لا يوجد عنوان مسجل للتاجر' : 'No registered address for merchant'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'العمولة المحسوبة' : 'Commission 💰', 
      accessorKey: 'commission_total',
      cell: (item) => {
        const totalComm = (item.order_items || []).reduce((acc, sub) => acc + (sub.commission_amount || 0), 0);
        return (
          <div className="flex flex-col items-center">
            <span className="font-black text-success text-sm bg-success/5 px-2.5 py-1.5 rounded-lg border border-success/10 whitespace-nowrap">
              +{totalComm.toFixed(2)} EGP
            </span>
          </div>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'إجمالي سعر التحصيل' : 'Final Price', 
      accessorKey: 'final_price',
      cell: (item) => {
        const items = item.order_items || [];
        const subtotal = items.reduce((acc, sub) => acc + ((sub.price_at_time || sub.unit_price || 0) * sub.quantity), 0);
        const shipping = Number(item.fixed_shipping_price || 0);
        return (
          <div className="flex flex-col text-start">
            <span className="font-black text-gray-900 text-sm">{(subtotal + shipping).toFixed(2)} EGP</span>
            <span className="text-[10px] text-gray-400">({subtotal.toFixed(2)} + {shipping.toFixed(2)} {locale === 'ar' ? 'شحن' : 'ship'})</span>
          </div>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'حالة الطلب (تغيير الحالة) 📦' : 'Order Status (Update) 📦', 
      accessorKey: 'status',
      cell: (item: AdminOrderView) => {
        const isUpdating = updatingId === item.id;
        
        return (
          <div className="flex items-center gap-2 min-w-[150px]">
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            ) : (
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                className={`text-xs font-extrabold px-3 py-2 rounded-xl border outline-none bg-white transition-all cursor-pointer ${
                  item.status === 'DELIVERED' ? 'border-green-200 text-green-700 bg-green-50/50' :
                  item.status === 'SHIPPED' ? 'border-blue-200 text-blue-700 bg-blue-50/50' :
                  item.status === 'CANCELLED' ? 'border-red-200 text-red-700 bg-red-50/50' :
                  'border-yellow-250 text-yellow-750 bg-yellow-50/50'
                }`}
              >
                <option value="PENDING">{locale === 'ar' ? '🆕 قيد المراجعة / الانتظار' : '🆕 Pending'}</option>
                <option value="SHIPPED">{locale === 'ar' ? '🚚 تم التسليم لشركة الشحن' : '🚚 Handed to Shipping'}</option>
                <option value="DELIVERED">{locale === 'ar' ? '✅ تم التسليم للعميل' : '✅ Delivered'}</option>
                <option value="CANCELLED">{locale === 'ar' ? '🔄 مرتجع / ملغي' : '🔄 Returned / Cancelled'}</option>
              </select>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">إدارة الطلبات وشحنها</h1>
          <p className="text-gray-500 mt-2">
            متابعة طلبات المتاجر، التحقق من بيانات التجار والتواصل معهم، وتتبع عمولات المنصة وأرباح الشحن.
          </p>
        </div>
        <div>
          <button 
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-semibold text-sm text-gray-700 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث الطلبات
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* glowing golden card for total commissions */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-6 shadow-xl shadow-amber-500/10 text-white flex flex-col justify-between min-h-[140px] border border-amber-400/20">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-extrabold text-amber-100">إجمالي أرباح المنصة من العمولات 💰</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight">
                {totalPlatformCommissions.toFixed(2)} EGP
              </h3>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
              <Coins className="w-6 h-6 text-yellow-100" />
            </div>
          </div>
          <p className="text-[10px] text-amber-200 mt-4 font-semibold">
            * تحتسب العمولات تلقائياً من نسبة عمولة كل تاجر محددة له في إعدادات الحساب.
          </p>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-400">إجمالي الطلبات النشطة</p>
              <h3 className="text-3xl font-black mt-2 text-gray-900">{orders.length} طلب</h3>
            </div>
            <div className="p-3 bg-primary/5 text-primary rounded-2xl border border-primary/10">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-semibold mt-4">
            تم فلترة وحجب أي طلبات لا تتبع أي تاجر في النظام تلقائياً.
          </p>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-700 font-semibold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 font-semibold shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <Loader size="lg" text={tCommon('loading') || 'Loading orders...'} />
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-100">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">لا توجد طلبات بعد</h3>
          <p className="text-gray-400 mt-1">لم يتم إجراء أي عمليات شراء تابعة للتجار على المنصة حتى الآن.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <DataTable 
              data={currentOrders} 
              columns={columns} 
              keyExtractor={(item) => item.id} 
            />
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gray-50/50 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                <span>إظهار</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-primary font-bold text-gray-700"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>طلبات من إجمالي {orders.length} طلب</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-400 text-gray-500"
                >
                  {locale === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                      currentPage === page
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev + 1, 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-400 text-gray-500"
                >
                  {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
