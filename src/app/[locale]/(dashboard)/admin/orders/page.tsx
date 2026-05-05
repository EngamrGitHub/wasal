'use client'

import { Column, DataTable } from '@/src/components/admin/DataTable';
import { MoreVertical } from 'lucide-react'
import { useTranslations } from 'next-intl';
import { Order } from '@/src/types';
import { OrderService } from '@/src/services/baseService';
import { useSupabaseData } from '@/src/hooks/useSupabaseData';
import { Loader } from '@/src/components/ui/Loader';

export default function AdminOrdersPage() {
  const t = useTranslations('Admin.Orders');
  const tCommon = useTranslations('Common');

  // جلب كل الطلبات باستخدام Generic Hook
  const { data: orders, loading, error } = useSupabaseData<Order>(OrderService);

  const columns: Column<Order>[] = [
    { 
      header: t('columns.order_id') || 'Order ID', 
      accessorKey: 'id',
      cell: (item) => <span className="text-xs text-gray-500 font-mono">{item.id.slice(0, 8)}...</span>
    },
    { 
      header: t('columns.customer') || 'Customer', 
      accessorKey: 'user_id',
      cell: (item) => <span className="text-xs text-gray-500">{item.user_id.slice(0, 8)}...</span>
    },
    { 
      header: t('columns.total') || 'Total', 
      accessorKey: 'total_amount',
      cell: (item) => <span className="font-bold">${item.total_amount.toFixed(2)}</span>
    },
    { 
      header: t('columns.status') || 'Status', 
      accessorKey: 'status',
      cell: (item: Order) => {
        const getStatusColor = (status: string) => {
          switch(status) {
            case 'PAID': case 'DELIVERED': return 'bg-success/10 text-success';
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-600';
            case 'SHIPPED': return 'bg-blue-500/10 text-blue-600';
            case 'CANCELLED': return 'bg-error/10 text-error';
            default: return 'bg-gray-100 text-gray-700';
          }
        };

        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
            {tCommon(`status.${item.status}`) || item.status}
          </span>
        );
      }
    },
    { 
      header: t('columns.date') || 'Date', 
      accessorKey: 'created_at',
      cell: (item: Order) => new Date(item.created_at).toLocaleDateString()
    },
    {
      header: tCommon('actions') || 'Actions',
      accessorKey: 'actions',
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 rounded-lg">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title') || 'Orders Management'}</h1>
          <p className="text-gray-500 mt-2">{t('description') || 'Track all orders.'}</p>
        </div>
      </div>

      {loading ? (
        <Loader size="lg" text={tCommon('loading') || 'Loading...'} />
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
          Error: {error}
        </div>
      ) : (
        <DataTable 
          data={orders} 
          columns={columns} 
          keyExtractor={(item) => item.id} 
        />
      )}
    </div>
  )
}
