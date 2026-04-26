'use client';

import { EmptyState } from '@/src/components/admin/EmptyState';
import { Column, DataTable } from '@/src/components/admin/DataTable';
import { ShoppingBag, Eye } from 'lucide-react';
import { Link } from '@/src/i18n/routing';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Mock data to demonstrate the UI until actual API integration
const initialOrders = [
  { id: 'ORD-001', customer: 'Ahmed Ali', date: '2023-10-25', total: 120.50, status: 'DELIVERED' },
  { id: 'ORD-002', customer: 'Sara Connor', date: '2023-10-26', total: 299.00, status: 'PROCESSING' },
  { id: 'ORD-003', customer: 'John Doe', date: '2023-10-26', total: 45.00, status: 'PENDING' },
  { id: 'ORD-004', customer: 'Mona Zaki', date: '2023-10-27', total: 89.99, status: 'CANCELLED' },
];

export default function MerchantOrdersPage() {
  const [orders] = useState(initialOrders);
  const t = useTranslations('Merchant.Orders');
  const tCommon = useTranslations('Common');

  const columns: Column<typeof orders[0]>[] = [
    { header: t('columns.order_id'), accessorKey: 'id' },
    { header: t('columns.customer'), accessorKey: 'customer' },
    { header: t('columns.date'), accessorKey: 'date' },
    { 
      header: t('columns.total'), 
      accessorKey: 'total',
      cell: (item) => `$${item.total.toFixed(2)}`
    },
    { 
      header: t('columns.status'), 
      accessorKey: 'status',
      cell: (item) => {
        let badgeStyle = 'bg-gray-100 text-gray-700';
        
        if (item.status === 'DELIVERED') {
          badgeStyle = 'bg-success/10 text-success';
        } else if (item.status === 'PROCESSING') {
          badgeStyle = 'bg-blue-100 text-blue-700';
        } else if (item.status === 'PENDING') {
          badgeStyle = 'bg-warning/10 text-warning';
        } else if (item.status === 'CANCELLED') {
          badgeStyle = 'bg-error/10 text-error';
        }

        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
            {tCommon(`status.${item.status}`)}
          </span>
        );
      }
    },
    {
      header: tCommon('actions'),
      accessorKey: 'actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 rounded-lg">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title')}</h1>
          <p className="text-gray-500 mt-2">{t('description')}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState 
          icon={ShoppingBag}
          title={t('empty_title')} 
          description={t('empty_desc')}
        />
      ) : (
        <DataTable 
          data={orders} 
          columns={columns} 
          keyExtractor={(item) => item.id} 
        />
      )}
    </div>
  );
}
