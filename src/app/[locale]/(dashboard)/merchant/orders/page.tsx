'use client';

import React, { useEffect, useState } from 'react';
import { Column, DataTable } from '@/src/components/admin/DataTable';
import { useTranslations, useLocale } from 'next-intl';
import { Loader } from '@/src/components/ui/Loader';
import { useSearchParams } from 'next/navigation';

interface MerchantOrderItemView {
  id: string;
  order_id: string;
  quantity: number;
  price_at_time: number;
  unit_price?: number;
  total_price?: number;
  orders: {
    status: string;
    created_at: string;
    fixed_shipping_price?: number;
  };
  products: {
    name_ar: string;
    name_en: string;
    title?: { en: string; ar: string };
    images?: string[];
    product_images?: { image_url: string }[];
  };
  variant: {
    sku: string | null;
    colors?: {
      name: string;
      hex_code: string;
    } | null;
    sizes?: {
      name: string;
    } | null;
  } | null;
  commission_amount?: number;
}

export default function MerchantOrdersPage() {
  const t = useTranslations('Merchant.Orders');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  const [orderItems, setOrderItems] = useState<MerchantOrderItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchantOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from our secure API endpoint that bypasses RLS for nested sizes and colors tables
      const response = await fetch('/api/merchant/orders', { cache: 'no-store' });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      setOrderItems((data as MerchantOrderItemView[]) || []);
    } catch (err: any) {
      console.error('Error fetching merchant orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantOrders();
  }, []);

  const filteredOrders = orderItems.filter((item) => {
    if (!searchQuery) return true;
    const orderIdMatch = item.order_id.toLowerCase().includes(searchQuery);
    
    const titleAr = item.products?.name_ar || item.products?.title?.ar || '';
    const titleEn = item.products?.name_en || item.products?.title?.en || '';
    const productMatch = titleAr.toLowerCase().includes(searchQuery) || titleEn.toLowerCase().includes(searchQuery);
    
    return orderIdMatch || productMatch;
  });

  const columns: Column<MerchantOrderItemView>[] = [
    { 
      header: t('columns.order_id') || 'Order ID', 
      accessorKey: 'order_id',
      cell: (item) => (
        <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 font-mono inline-block shadow-sm">
          {item.order_id.split('-')[0]}
        </span>
      )
    },
    { 
      header: locale === 'ar' ? 'المنتج المطلوب' : 'Requested Product', 
      accessorKey: 'products',
      cell: (item) => {
        const title = locale === 'ar' 
          ? item.products?.name_ar || item.products?.title?.ar || productNameFallback()
          : item.products?.name_en || item.products?.title?.en || productNameFallback();
        
        const defaultImg = item.products?.images?.[0] 
          || item.products?.product_images?.[0]?.image_url
          || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100';

        return (
          <div className="flex items-center gap-3 text-start">
            <img src={defaultImg} alt={title} className="w-10 h-10 rounded-md object-cover border border-gray-100 shrink-0" />
            <span className="font-bold text-sm text-gray-900 line-clamp-2">{title}</span>
          </div>
        );
      }
    },
    {
      header: locale === 'ar' ? 'المواصفات المطلوبة للتحضير' : 'Attributes for Preparation',
      accessorKey: 'variant_details',
      cell: (item) => {
        const colorName = item.variant?.colors?.name || (locale === 'ar' ? 'غير محدد' : 'N/A');
        const hex = item.variant?.colors?.hex_code;
        const sizeName = item.variant?.sizes?.name || (locale === 'ar' ? 'غير محدد' : 'N/A');
        const sku = item.variant?.sku || '—';

        return (
          <div className="flex flex-col text-start space-y-1.5 text-xs">
            {/* Color Swatch */}
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-gray-500">{locale === 'ar' ? 'اللون:' : 'Color:'}</span>
              <span className="text-gray-950 font-bold">{colorName}</span>
              {hex && (
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-gray-350 shadow-sm shrink-0" 
                  style={{ backgroundColor: hex }} 
                  title={colorName}
                />
              )}
            </div>
            {/* Size */}
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-gray-500">{locale === 'ar' ? 'المقاس:' : 'Size:'}</span>
              <span className="px-2 py-0.5 bg-primary/5 text-primary rounded font-bold border border-primary/10">
                {sizeName}
              </span>
            </div>
            {/* SKU */}
            <div className="text-[10px] text-gray-400 font-mono">
              SKU: {sku}
            </div>
          </div>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'الكمية المطلوبة' : 'Qty', 
      accessorKey: 'quantity',
      cell: (item) => (
        <span className="font-extrabold text-base bg-gray-100 text-gray-800 px-3 py-1 rounded-lg">
          {item.quantity}
        </span>
      )
    },
    { 
      header: locale === 'ar' ? 'مستحقات المتجر 💵' : 'My Payout 💵', 
      accessorKey: 'payout',
      cell: (item) => {
        // Calculate the exact product price/earnings the merchant specified (excluding shipping/commission)
        const price = item.price_at_time || item.unit_price || 0;
        const totalPayout = price * item.quantity;
        return (
          <span className="font-black text-success text-sm bg-success/5 px-2.5 py-1.5 rounded-lg border border-success/10 whitespace-nowrap">
            {totalPayout.toFixed(2)} EGP
          </span>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'سعر تحصيل العميل 🚚' : 'Customer Collection', 
      accessorKey: 'total',
      cell: (item) => {
        const price = item.price_at_time || item.unit_price || 0;
        const subtotal = item.quantity * price;
        const shipping = Number(item.orders?.fixed_shipping_price || 0);
        return (
          <div className="flex flex-col text-start">
            <span className="font-black text-gray-900 text-sm">{(subtotal + shipping).toFixed(2)} EGP</span>
            <span className="text-[10px] text-gray-400">({subtotal.toFixed(2)} + {shipping.toFixed(2)} {locale === 'ar' ? 'شحن' : 'ship'})</span>
          </div>
        );
      }
    },
    { 
      header: t('columns.status') || 'Status', 
      accessorKey: 'status',
      cell: (item) => {
        const status = item.orders?.status || 'UNKNOWN';
        const getStatusColor = (s: string) => {
          switch(s) {
            case 'PAID': case 'DELIVERED': return 'bg-success/10 text-success';
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-600';
            case 'SHIPPED': return 'bg-blue-500/10 text-blue-600';
            case 'CANCELLED': return 'bg-error/10 text-error';
            default: return 'bg-gray-100 text-gray-700';
          }
        };

        return (
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(status)}`}>
            {tCommon(`status.${status}`) || status}
          </span>
        );
      }
    },
    { 
      header: t('columns.date') || 'Date', 
      accessorKey: 'date',
      cell: (item) => item.orders ? new Date(item.orders.created_at).toLocaleDateString('ar-EG') : 'N/A'
    }
  ];

  function productNameFallback() {
    return locale === 'ar' ? 'منتج متجر وصال' : 'Wesal Store Product';
  }

  if (loading) {
    return <Loader size="lg" text={tCommon('loading') || 'Loading orders...'} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title') || 'Orders'}</h1>
          <p className="text-gray-500 mt-2">
            {locale === 'ar' 
              ? 'تجهيز وتحضير طلبات العملاء بالكمية والمواصفات (المقاس واللون) المطلوبة.' 
              : 'Prepare customer orders with requested quantities and attributes.'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
          Error: {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{searchQuery ? (locale === 'ar' ? 'لا توجد نتائج بحث' : 'No search results') : (t('empty_title') || 'No Orders Yet')}</h3>
          <p className="text-gray-500 mt-1">{searchQuery ? (locale === 'ar' ? 'لم يتم العثور على طلبات تطابق بحثك' : 'No orders match your search query') : (t('empty_desc') || "You don't have any orders at the moment. Keep promoting your store!")}</p>
        </div>
      ) : (
        <DataTable 
          data={filteredOrders} 
          columns={columns} 
          keyExtractor={(item) => item.id} 
        />
      )}
    </div>
  );
}
