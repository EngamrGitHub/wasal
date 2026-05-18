'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Product } from '@/src/types';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { useSupabaseData } from '@/src/hooks/useSupabaseData';
import { ProductService } from '@/src/services/productService'; // We will extend this to get Merchant Products
import { Loader } from '@/src/components/ui/Loader';
import { Plus, Info } from 'lucide-react';
import { BaseService } from '@/src/services/baseService';
import { Link } from '@/src/i18n/routing';

// We can use the Generic BaseService directly for products here 
// because Supabase Row Level Security (RLS) will automatically filter by Merchant's Store!
const MerchantProductService = new BaseService<Product>('products');

export default function MerchantProductsPage() {
  const t = useTranslations('Merchant.Products');
  const tCommon = useTranslations('Common');

  // Fetching ONLY this merchant's products (RLS Policy handles the security)
  const { data: products, loading, error } = useSupabaseData<Product>(MerchantProductService);

  if (loading) {
    return <Loader size="lg" text={tCommon('loading') || "Loading your products..."} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title') || 'My Products'}</h1>
          <p className="text-gray-500 mt-2">{t('description') || 'Manage your products and monitor their approval status.'}</p>
        </div>
        <Link href="/merchant/products/add" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          {t('add_button') || 'Add Product'}
        </Link>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
          Error: {error}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('empty_title') || 'No Products Yet'}</h3>
            <p className="text-gray-500 max-w-sm mt-1">{t('empty_desc') || 'Start adding products to reach more customers.'}</p>
          </div>
          <Link href="/merchant/products/add" className="mt-2 bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition inline-block">
             {t('empty_btn') || 'Add Your First Product'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            // Helper to style the status badge
            const getStatusStyle = (status: string) => {
              switch(status) {
                case 'APPROVED': return 'bg-success/10 text-success border-success/20';
                case 'PENDING': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
                case 'REJECTED': return 'bg-error/10 text-error border-error/20';
                default: return 'bg-gray-100 text-gray-700';
              }
            };

            return (
              <div key={product.id} className="relative flex flex-col">
                <ProductCard 
                  product={product} 
                  renderBadge={(status) => (
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusStyle(status)}`}>
                      {tCommon(`status.${status}`) || status}
                    </span>
                  )}
                />

                {/* If product is rejected, show the reason clearly to the merchant */}
                {product.approval_status === 'REJECTED' && product.rejection_reason && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-700">Rejection Reason:</p>
                      <p className="text-xs text-red-600 mt-0.5">{product.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
