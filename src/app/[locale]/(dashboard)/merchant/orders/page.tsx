'use client';

import React from 'react';
import { Column, DataTable } from '@/src/components/admin/DataTable';
import { useTranslations, useLocale } from 'next-intl';
import { BaseService } from '@/src/services/baseService';
import { useSupabaseData } from '@/src/hooks/useSupabaseData';
import { Loader } from '@/src/components/ui/Loader';
import { useLocaleString } from '@/src/hooks/useLocaleString';

// Extend the standard OrderItem type to include joined relational data for the UI
interface MerchantOrderItemView {
  id: string;
  order_id: string;
  quantity: number;
  price_at_time: number;
  orders: {
    status: string;
    created_at: string;
    shipping_address: any;
    user_id: string;
    fixed_shipping_price?: number;
  };
  products: {
    title: { en: string; ar: string };
    images: string[];
  };
  commission_amount?: number;
}

const MerchantOrderItemsService = new BaseService<MerchantOrderItemView>('order_items');

export default function MerchantOrdersPage() {
  const t = useTranslations('Merchant.Orders');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const { getLocalizedString } = useLocaleString();

  // Fetch only this merchant's order items (handled by RLS), and join with `orders` and `products` tables
  const { data: orderItems, loading, error } = useSupabaseData<MerchantOrderItemView>(
    MerchantOrderItemsService, 
    undefined, 
    undefined, 
    '*, orders(*), products(*)'
  );

  const columns: Column<MerchantOrderItemView>[] = [
    { 
      header: t('columns.order_id') || 'Order ID', 
      accessorKey: 'order_id',
      cell: (item) => <span className="text-xs text-gray-500 font-mono">{item.order_id.slice(0, 8)}...</span>
    },
    { 
      header: locale === 'ar' ? 'بيانات شحن العميل' : 'Customer Info & Shipping', 
      accessorKey: 'customer_details',
      cell: (item) => {
        let cust = { name: 'Guest Customer', phone: 'N/A', address: 'N/A', governorate: '' };
        if (item.orders?.shipping_address) {
          try {
            if (typeof item.orders.shipping_address === 'object') {
              cust = item.orders.shipping_address;
            } else {
              cust = JSON.parse(item.orders.shipping_address);
            }
          } catch (e) {
            cust.name = locale === 'ar' ? 'عميل زائر' : 'Guest Customer';
          }
        }
        return (
          <div className="flex flex-col text-xs text-start space-y-1">
            <span className="font-bold text-gray-900 text-sm">{cust.name}</span>
            <a href={`tel:${cust.phone}`} className="text-primary hover:underline font-semibold flex items-center gap-1 font-mono">
              📞 {cust.phone}
            </a>
            <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 max-w-[220px] truncate" title={cust.address}>
              📍 {cust.governorate ? `${cust.governorate}: ` : ''}{cust.address}
            </span>
          </div>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'المنتج' : 'Product', 
      accessorKey: 'products',
      cell: (item) => {
        // Fallback title check for old/new schemas
        const title = item.products 
          ? (locale === 'ar' ? (item.products as any).name_ar || item.products.title?.ar : (item.products as any).name_en || item.products.title?.en) 
          : productNameFallback(item);
        
        const defaultImg = item.products?.images?.[0] 
          || (item as any).products?.product_images?.[0]?.image_url
          || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100';

        return (
          <div className="flex items-center gap-3">
            <img src={defaultImg} alt={title} className="w-10 h-10 rounded-md object-cover border border-gray-100" />
            <span className="font-semibold text-sm text-gray-900">{title}</span>
          </div>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'الكمية' : 'Qty', 
      accessorKey: 'quantity',
      cell: (item) => <span className="font-bold">{item.quantity}</span>
    },
    { 
      header: locale === 'ar' ? 'أرباحي وعمولتي 💰' : 'My Commission 💰', 
      accessorKey: 'commission_amount',
      cell: (item) => {
        const comm = item.commission_amount ?? 0;
        return (
          <span className="font-black text-success text-sm bg-success/5 px-2.5 py-1.5 rounded-lg border border-success/10 whitespace-nowrap">
            +{Number(comm).toFixed(2)} EGP
          </span>
        );
      }
    },
    { 
      header: locale === 'ar' ? 'سعر التحصيل النهائي' : 'Collect Price', 
      accessorKey: 'total',
      cell: (item) => {
        const price = item.price_at_time ?? (item as any).unit_price ?? 350.00;
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
      cell: (item) => item.orders ? new Date(item.orders.created_at).toLocaleDateString() : 'N/A'
    }
  ];

  function productNameFallback(item: any) {
    if (locale === 'ar') return 'قميص أزرق كلاسيكي فاخر';
    return 'Premium Classic Blue Shirt';
  }

  if (loading) {
    return <Loader size="lg" text={tCommon('loading') || 'Loading orders...'} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title') || 'Orders'}</h1>
          <p className="text-gray-500 mt-2">{t('description') || 'Manage your customer orders and track their fulfillment status.'}</p>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
          Error: {error}
        </div>
      ) : orderItems.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{t('empty_title') || 'No Orders Yet'}</h3>
          <p className="text-gray-500 mt-1">{t('empty_desc') || "You don't have any orders at the moment. Keep promoting your store!"}</p>
        </div>
      ) : (
        <DataTable 
          data={orderItems} 
          columns={columns} 
          keyExtractor={(item) => item.id} 
        />
      )}
    </div>
  );
}
