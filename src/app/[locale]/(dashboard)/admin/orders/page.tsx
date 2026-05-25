'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Column, DataTable } from '@/src/components/admin/DataTable';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/src/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { 
  ShoppingBag, Calendar, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Coins, User, Phone, Mail, Store, Search
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

function AdminOrdersContent() {
  const t = useTranslations('Admin.Orders');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  const [orders, setOrders] = useState<AdminOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [expandedMerchants, setExpandedMerchants] = useState<Record<string, boolean>>({});

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

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const router = useRouter();
  const pathname = usePathname();



  // Calculate total platform commissions from all orders
  const totalPlatformCommissions = orders.reduce((acc, order) => {
    const items = order.order_items || [];
    const orderComm = items.reduce((sum, item) => sum + (item.commission_amount || 0), 0);
    return acc + orderComm;
  }, 0);

  // Apply search query filtering (case-insensitive local state)
  const normalizedQ = searchQuery.trim().toLowerCase();
  const filteredOrders = orders.filter(order => {
    if (!normalizedQ) return true;
    
    // 1. Check Order ID
    if (order.id.toLowerCase().includes(normalizedQ)) return true;
    
    // 2. Check Customer Shipping Info
    let cust = { name: '', phone: '', address: '', governorate: '' };
    if (order.shipping_address) {
      try {
        cust = typeof order.shipping_address === 'object'
          ? order.shipping_address
          : JSON.parse(order.shipping_address);
      } catch {}
    }
    if (cust.name?.toLowerCase().includes(normalizedQ)) return true;
    if (cust.phone?.toLowerCase().includes(normalizedQ)) return true;
    if (cust.address?.toLowerCase().includes(normalizedQ)) return true;
    if (cust.governorate?.toLowerCase().includes(normalizedQ)) return true;

    // 3. Check Order Items (Product name, SKU, Merchant store)
    return (order.order_items || []).some(sub => {
      const pTitleAr = sub.products?.name_ar?.toLowerCase() || '';
      const pTitleEn = sub.products?.name_en?.toLowerCase() || '';
      const sku = sub.variant?.sku?.toLowerCase() || '';
      const storeAr = sub.merchant_details?.store_name_ar?.toLowerCase() || '';
      const storeEn = sub.merchant_details?.store_name_en?.toLowerCase() || '';
      const merchantName = sub.merchant_details?.merchant_name?.toLowerCase() || '';

      return pTitleAr.includes(normalizedQ) ||
             pTitleEn.includes(normalizedQ) ||
             sku.includes(normalizedQ) ||
             storeAr.includes(normalizedQ) ||
             storeEn.includes(normalizedQ) ||
             merchantName.includes(normalizedQ);
    });
  });

  const columns: Column<AdminOrderView>[] = [
    { 
      header: t('columns.order_id') || 'Order ID', 
      accessorKey: 'id',
      cell: (item) => (
        <div className="flex flex-col text-start gap-1">
          <span 
            className="text-xs font-bold font-mono bg-gray-100 text-gray-800 px-2.5 py-1 rounded-xl border border-gray-200 shadow-sm inline-block select-all hover:bg-gray-200 transition-all text-center" 
            title={item.id}
          >
            #{item.id.slice(0, 8)}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 font-semibold whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {new Date(item.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
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
          <div className="flex flex-col text-xs text-start space-y-1.5 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/60 min-w-[240px]">
            <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              {cust.name}
            </span>
            <a href={`tel:${cust.phone}`} className="text-blue-700 hover:text-blue-900 hover:underline font-extrabold flex items-center gap-1 font-mono text-sm">
              📞 {cust.phone}
            </a>
            <span className="text-[11px] text-gray-600 font-semibold leading-relaxed mt-1 border-t border-blue-100/60 pt-1">
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
          <div className="flex flex-col gap-3 text-start min-w-[340px]">
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
                <div key={i} className="text-xs bg-gray-50/70 p-3.5 rounded-2xl border border-gray-150/60 flex flex-col space-y-2.5 shadow-sm">
                  {/* Product block */}
                  <div className="flex items-start gap-2.5">
                    <img src={defaultImg} alt={pTitle} className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0" />
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-extrabold text-gray-900 leading-snug">{pTitle}</span>
                      <span className="text-[10px] text-gray-400 font-mono">SKU: {sub.variant?.sku || '—'}</span>
                    </div>
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg text-xs font-black ms-auto">
                      x{sub.quantity}
                    </span>
                  </div>

                  {/* Attributes */}
                  {(colorName || sizeName) && (
                    <div className="text-[10px] text-gray-600 font-bold flex items-center gap-2.5 bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-sm w-fit">
                      {colorName && (
                        <span className="flex items-center gap-1.5">
                          {colorHex && (
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm inline-block shrink-0" 
                              style={{ backgroundColor: colorHex }}
                            />
                          )}
                          {!colorHex && "🎨"} {colorName}
                        </span>
                      )}
                      {sizeName && <span className="flex items-center gap-1">📏 {sizeName}</span>}
                    </div>
                  )}

                  {/* Collapsible Merchant details */}
                  <div className="bg-white p-3 rounded-xl border border-gray-100/90 flex flex-col space-y-2 text-[10px] shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-extrabold text-primary flex items-center gap-1.5">
                        <Store className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[150px]">{storeName}</span>
                      </div>
                      <button
                        onClick={() => setExpandedMerchants(prev => ({
                          ...prev,
                          [`${item.id}_${i}`]: !prev[`${item.id}_${i}`]
                        }))}
                        className="text-primary hover:text-white hover:bg-primary transition-all font-black text-[9px] bg-primary/5 px-2.5 py-1 rounded-lg cursor-pointer shrink-0 border border-primary/10"
                      >
                        {expandedMerchants[`${item.id}_${i}`]
                          ? (locale === 'ar' ? 'إخفاء التفاصيل ❌' : 'Hide Details ❌')
                          : (locale === 'ar' ? 'بيانات التاجر 🏪' : 'Merchant Info 🏪')}
                      </button>
                    </div>

                    {expandedMerchants[`${item.id}_${i}`] && (
                      <div className="space-y-1.5 mt-1.5 pt-1.5 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="text-gray-500 flex items-center gap-1.5 font-semibold">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{m.merchant_name}</span>
                        </div>
                        <div className="text-gray-500 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a href={`tel:${m.merchant_phone}`} className="hover:underline text-primary font-bold">{m.merchant_phone}</a>
                        </div>
                        <div className="text-gray-500 flex items-center gap-1.5 font-mono">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{m.merchant_email}</span>
                        </div>
                        {m.address ? (
                          <div className="text-gray-500 flex items-start gap-1.5 font-semibold mt-1.5 pt-1.5 border-t border-gray-100">
                            <span className="shrink-0 text-primary">📍</span>
                            <span className="leading-normal">
                              {locale === 'ar' ? m.address.governorate_name_ar : m.address.governorate_name_en} - {m.address.city} - {m.address.street} - {m.address.building} {m.address.floor ? `, ${m.address.floor}` : ''} {m.address.notes ? `(${m.address.notes})` : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="text-amber-600 flex items-start gap-1.5 font-semibold mt-1.5 pt-1.5 border-t border-gray-100">
                            <span className="shrink-0">📍</span>
                            <span>{locale === 'ar' ? 'لا يوجد عنوان مسجل للتاجر' : 'No registered address for merchant'}</span>
                          </div>
                        )}
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
          <div className="flex flex-col text-start whitespace-nowrap">
            <span className="font-black text-gray-900 text-base">{(subtotal + shipping).toFixed(2)} EGP</span>
            <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200 mt-1 max-w-fit text-center">
              {subtotal.toFixed(2)} + {shipping.toFixed(2)} {locale === 'ar' ? 'شحن' : 'ship'}
            </span>
          </div>
        );
      }
    },
    {
      header: locale === 'ar' ? 'إرسال واتساب للعميل 📲' : 'WhatsApp Customer 📲',
      accessorKey: 'whatsapp_action',
      cell: (item: AdminOrderView) => {
        let custPhone = '';
        try {
          const addr = typeof item.shipping_address === 'object'
            ? item.shipping_address
            : JSON.parse(item.shipping_address || '{}');
          custPhone = (addr.phone || '').replace(/[^0-9]/g, '');
          // Convert Egyptian 01x → 201x international
          if (custPhone.startsWith('0')) custPhone = '2' + custPhone;
        } catch {}

        const buildWaUrl = () => {
          const items = item.order_items || [];
          let addr: any = {};
          try {
            addr = typeof item.shipping_address === 'object'
              ? item.shipping_address
              : JSON.parse(item.shipping_address || '{}');
          } catch {}

          const subtotal = items.reduce((acc, sub) =>
            acc + ((sub.price_at_time || sub.unit_price || 0) * sub.quantity), 0);
          const shipping = Number(item.fixed_shipping_price || 0);
          const total = subtotal + shipping;

          const productLines = items.map((sub) => {
            const pName = locale === 'ar' ? sub.products?.name_ar : sub.products?.name_en;
            const color = sub.variant?.colors?.name || '';
            const size = sub.variant?.sizes?.name || '';
            const variant = [color, size].filter(Boolean).join(' - ');
            return `• ${pName}${variant ? ` (${variant})` : ''} × ${sub.quantity}`;
          }).join('\n');

          const msg = [
            '🛍️ *تفاصيل طلبك من متجر وصال*',
            '',
            `👤 *الاسم:* ${addr.name || ''}`,
            `📞 *الهاتف:* ${addr.phone || ''}`,
            `📍 *المحافظة:* ${addr.governorate || ''}`,
            `🏠 *العنوان:* ${addr.address || ''}`,
            '',
            '🧾 *المنتجات المطلوبة:*',
            productLines,
            '',
            `💰 *سعر المنتجات:* ${subtotal.toFixed(2)} جنيه`,
            `🚚 *الشحن:* ${shipping.toFixed(2)} جنيه`,
            `✅ *الإجمالي الكلي: ${total.toFixed(2)} جنيه*`,
            '',
            '📦 شكراً لتسوقك معنا! سيتم التواصل معك قريباً لتأكيد الشحن.',
          ].join('\n');

          return `https://wa.me/${custPhone}?text=${encodeURIComponent(msg)}`;
        };

        if (!custPhone) {
          return (
            <span className="text-xs text-gray-400 italic">
              {locale === 'ar' ? 'لا يوجد رقم' : 'No phone'}
            </span>
          );
        }

        return (
          <a
            href={buildWaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all duration-200 hover:opacity-90 active:scale-95 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
            title={locale === 'ar' ? 'إرسال تفاصيل الطلب على واتساب' : 'Send order details on WhatsApp'}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {locale === 'ar' ? 'واتساب' : 'WhatsApp'}
          </a>
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
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className={`absolute ${locale === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                const params = new URLSearchParams(searchParams.toString());
                if (val) {
                  params.set('search', val);
                } else {
                  params.delete('search');
                }
                router.replace(`${pathname}?${params.toString()}` as any);
              }}
              placeholder={locale === 'ar' ? 'بحث بالاسم، الهاتف، المنتج...' : 'Search by name, phone, product...'}
              className={`h-10 w-64 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm outline-none transition-all ${locale === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>
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
      ) : filteredOrders.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-100">
          <ShoppingBag className="w-12 h-12 text-gray-350 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">لا توجد نتائج بحث مطابقة</h3>
          <p className="text-gray-400 mt-1">جرب البحث بكلمات أخرى أو أرقام هواتف مختلفة.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable 
            data={filteredOrders} 
            columns={columns} 
            keyExtractor={(item) => item.id}
            itemsPerPage={10}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Loader size="lg" text="جاري تحميل الطلبات..." />}>
      <AdminOrdersContent />
    </Suspense>
  );
}
