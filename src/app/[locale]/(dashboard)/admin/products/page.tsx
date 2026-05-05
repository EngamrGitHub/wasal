'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/src/types';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { ProductService } from '@/src/services/productService';
import { useTranslations } from 'next-intl';

export default function AdminProductsPage() {
  const tAdmin = useTranslations('Admin.Products');
  const tCommon = useTranslations('Common');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // For demonstration: load pending products.
  // In a real app, you might use React Query or SWR here.
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // We'll fetch pending products to demonstrate the approval flow
        // Fallback to empty array if DB is not setup yet (to avoid crashing)
        const data = await ProductService.getPendingProducts().catch(() => []);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const handleApprove = async (productId: string) => {
    try {
      await ProductService.approveProduct(productId);
      // Remove from pending list
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('Product Approved!');
    } catch (error) {
      alert('Failed to approve product');
    }
  };

  const handleReject = async (productId: string) => {
    const reason = prompt('Please enter a rejection reason:');
    if (!reason) return;
    
    try {
      await ProductService.rejectProduct(productId, reason);
      // Remove from pending list
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('Product Rejected!');
    } catch (error) {
      alert('Failed to reject product');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">{tCommon('loading') || 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">{tAdmin('title') || 'Products Management'}</h1>
        <p className="text-gray-500 mt-2">{tAdmin('description') || 'Review and manage pending products from merchants.'}</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
          <p className="text-gray-500 text-lg">No pending products to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard 
                product={product} 
                renderBadge={(status) => (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-100 text-yellow-800">
                    {status}
                  </span>
                )}
              />
              
              {/* Overlay Actions for Admin */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3 p-4">
                <button 
                  onClick={() => handleApprove(product.id)}
                  className="w-full bg-success text-white font-bold py-2 rounded-lg hover:bg-success/90 transition"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReject(product.id)}
                  className="w-full bg-error text-white font-bold py-2 rounded-lg hover:bg-error/90 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
