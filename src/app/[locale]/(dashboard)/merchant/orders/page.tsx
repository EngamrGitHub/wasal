'use client';

import React from 'react';
import { Column, DataTable } from '@/src/components/admin/DataTable';
import { useTranslations } from 'next-intl';
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
  };
  products: {
    title: { en: string; ar: string };
    images: string[];
  };
}

const MerchantOrderItemsService = new BaseService<MerchantOrderItemView>('order_items');

export default function MerchantOrdersPage() {
  const t = useTranslations('Merchant.Orders');
  const tCommon = useTranslations('Common');
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
      header: 'Product', 
      accessorKey: 'products',
      cell: (item) => {
        const title = item.products ? getLocalizedString(item.products.title) : 'Unknown Product';
        return (
          <div className="flex items-center gap-3">
            {item.products?.images?.[0] ? (
              <img src={item.products.images[0]} alt={title} className="w-10 h-10 rounded-md object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-[10px] text-gray-400">
                No Img
              </div>
            )}
            <span className="font-medium text-sm text-gray-900">{title}</span>
          </div>
        );
      }
    },
    { 
      header: 'Qty', 
      accessorKey: 'quantity',
      cell: (item) => <span className="font-bold">{item.quantity}</span>
    },
    { 
      header: t('columns.total') || 'Total', 
      accessorKey: 'total',
      cell: (item) => <span className="font-bold text-primary">${(item.quantity * item.price_at_time).toFixed(2)}</span>
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
