'use client';

import { EmptyState } from '@/src/components/admin/EmptyState';
import { Column, DataTable } from '@/src/components/admin/DataTable';
import { PackagePlus, Plus, Package } from 'lucide-react';
import { Link } from '@/src/i18n/routing';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Mock data to demonstrate the UI until actual API integration
const initialProducts = [
  { id: '1', title: 'Premium Sneakers', price: 120, stock: 45, status: 'APPROVED' },
  { id: '2', title: 'Wireless Headphones', price: 299, stock: 12, status: 'PENDING_APPROVAL' },
  { id: '3', title: 'Cotton T-Shirt', price: 25, stock: 100, status: 'REJECTED' },
];

export default function MerchantProductsPage() {
  const [products] = useState(initialProducts);
  const t = useTranslations('Merchant.Products');
  const tCommon = useTranslations('Common');

  const columns: Column<typeof products[0]>[] = [
    { header: t('columns.title'), accessorKey: 'title' },
    { 
      header: t('columns.price'), 
      accessorKey: 'price',
      cell: (item) => `$${item.price.toFixed(2)}`
    },
    { header: t('columns.stock'), accessorKey: 'stock' },
    { 
      header: t('columns.status'), 
      accessorKey: 'status',
      cell: (item) => {
        let badgeStyle = 'bg-gray-100 text-gray-700';
        
        if (item.status === 'APPROVED') {
          badgeStyle = 'bg-success/10 text-success';
        } else if (item.status === 'PENDING_APPROVAL') {
          badgeStyle = 'bg-warning/10 text-warning';
        } else if (item.status === 'REJECTED') {
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
          <Link
            href={`/merchant/products/${item.id}`}
            className="text-sm font-bold text-primary hover:underline"
          >
            {tCommon('edit')}
          </Link>
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
        <Link 
          href="/merchant/products/add" 
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('add_button')}
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState 
          icon={Package}
          title={t('empty_title')} 
          description={t('empty_desc')}
          action={
            <Link 
              href="/merchant/products/add" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <PackagePlus className="w-5 h-5" />
              {t('empty_btn')}
            </Link>
          }
        />
      ) : (
        <DataTable 
          data={products} 
          columns={columns} 
          keyExtractor={(item) => item.id} 
        />
      )}
    </div>
  );
}
