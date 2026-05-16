'use client'

import React, { useEffect, useState } from 'react'
import { ProductCard } from '@/src/components/ui/ProductCard'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ProductService } from '@/src/services/productService'
import { Product } from '@/src/types'

// Placeholder data for fallback
const dummyProducts: Partial<Product>[] = [
  {
    id: '1',
    name_ar: 'سماعات رأس لاسلكية ممتازة',
    name_en: 'Premium Wireless Headphones',
    product_variants: [{ id: 'var1', price: 299.99, stock_quantity: 10, weight_kg: 0.5, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', is_active: true, product_id: '1', sku: null, color_id: null, size_id: null }],
    product_images: [],
  },
  {
    id: '2',
    name_ar: 'ساعة ذكية متطورة',
    name_en: 'Advanced Smart Watch',
    product_variants: [{ id: 'var2', price: 199.99, stock_quantity: 15, weight_kg: 0.2, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', is_active: true, product_id: '2', sku: null, color_id: null, size_id: null }],
    product_images: [],
  },
  {
    id: '3',
    name_ar: 'حقيبة ظهر للكمبيوتر المحمول',
    name_en: 'Minimalist Laptop Backpack',
    product_variants: [{ id: 'var3', price: 89.99, stock_quantity: 20, weight_kg: 1.2, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', is_active: true, product_id: '3', sku: null, color_id: null, size_id: null }],
    product_images: [],
  },
  {
    id: '4',
    name_ar: 'نظارات شمسية كلاسيكية',
    name_en: 'Classic Sunglasses',
    product_variants: [{ id: 'var4', price: 159.99, stock_quantity: 5, weight_kg: 0.1, image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80', is_active: true, product_id: '4', sku: null, color_id: null, size_id: null }],
    product_images: [],
  }
];

export function ProductGrid() {
  const t = useTranslations('Home')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const data = await ProductService.getApprovedProducts()
        setProducts(data)
      } catch (error) {
        console.error("Failed to fetch products from Supabase, using dummy data", error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {t('featured_products')}
          </h2>
          <p className="text-gray-500 mt-1">{t('featured_products_desc')}</p>
        </div>
        <Link 
          href="/products" 
          className="px-6 py-2 rounded-full border-2 border-gray-100 font-bold text-gray-600 hover:border-primary hover:text-primary transition-all duration-300"
        >
          {t('view_all')}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className="h-80 bg-gray-100 rounded-2xl"></div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length > 0 
            ? products.map((product) => <ProductCard key={product.id} product={product} />)
            : dummyProducts.map((product) => <ProductCard key={product.id} product={product as Product} />)
          }
        </div>
      )}
    </section>
  )
}
