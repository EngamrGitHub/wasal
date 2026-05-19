'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/src/lib/supabase/client';
import { Product, Category } from '@/src/types';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { Loader } from '@/src/components/ui/Loader';
import { Link } from '@/src/i18n/routing';
import { AlertCircle, FolderOpen, LayoutGrid } from 'lucide-react';

export default function CategoryById() {
  const params = useParams();
  const categoriesId = params.categoriesId as string;
  const locale = useLocale();
  const tCommon = useTranslations('Common');
  const isRtl = locale === 'ar';

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        if (!supabase) throw new Error('Supabase client not initialized');

        // 1. Fetch all categories first to resolve both slugs and UUIDs
        const { data: allCategories, error: catError } = await supabase
          .from('categories')
          .select('*');

        if (catError) throw catError;

        const categoriesList = (allCategories || []) as Category[];

        // Find the category matching the ID (either direct UUID match or loose slug/name match)
        let resolvedCategory: Category | null = null;
        if (categoriesList.length > 0) {
          resolvedCategory = categoriesList.find(c => c.id === categoriesId) || null;
          
          if (!resolvedCategory) {
            // Slug translation mapper fallback
            const slugMapping: Record<string, string> = {
              'fashion': 'ملابس',
              'electronics': 'إلكترونيات',
              'home': 'منزل',
              'beauty': 'جمال',
              'toys': 'ألعاب',
              'sports': 'رياضة',
              'supermarket': 'سوبر',
              'books': 'كتب'
            };

            const searchSlug = slugMapping[categoriesId] || categoriesId;
            resolvedCategory = categoriesList.find(c => {
              const nameAr = (c.name_ar || '').toLowerCase();
              const nameEn = (c.name_en || '').toLowerCase();
              return nameAr.includes(searchSlug.toLowerCase()) || nameEn.includes(searchSlug.toLowerCase());
            }) || null;
          }
        }

        // If still not resolved but the categoriesId is a valid format, try fetching directly
        if (!resolvedCategory && categoriesId.length === 36) {
          const { data: catDirect } = await supabase
            .from('categories')
            .select('*')
            .eq('id', categoriesId)
            .single();
          if (catDirect) resolvedCategory = catDirect as unknown as Category;
        }

        setCategory(resolvedCategory);

        // 2. Fetch products for this category
        let query = supabase
          .from('products')
          .select('*, product_variants(*), product_images(*)')
          .eq('approval_status', 'APPROVED')
          .eq('is_active', true);

        if (resolvedCategory) {
          query = query.eq('category_id', resolvedCategory.id);
        } else {
          // If no specific category matched, fallback to fetch all products to avoid empty page
          console.warn(`No category matched for '${categoriesId}', listing all products.`);
        }

        const { data: productsData, error: productsError } = await query.order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData as unknown as Product[] || []);

      } catch (err: any) {
        console.error('Error loading category products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    if (categoriesId) {
      fetchCategoryProducts();
    }
  }, [categoriesId]);

  if (loading) {
    return <Loader size="lg" text={isRtl ? 'جاري تحميل منتجات الفئة...' : 'Loading category products...'} />;
  }

  const categoryName = category 
    ? (isRtl ? category.name_ar : category.name_en) 
    : (isRtl ? 'منتجات مميزة' : 'Featured Products');

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-medium">
        <Link href="/" className="hover:text-primary transition-colors">
          {isRtl ? 'الرئيسية' : 'Home'}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-bold">
          {categoryName}
        </span>
      </nav>

      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 lg:p-12 mb-10 border border-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary shrink-0" />
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
              {categoryName}
            </h1>
          </div>
          <p className="text-gray-500 font-medium max-w-xl">
            {isRtl 
              ? `تصفح مجموعة واسعة من المنتجات عالية الجودة ضمن تصنيف ${categoryName} بأسعار لا تقبل المنافسة.`
              : `Browse a wide range of high quality products under the ${categoryName} category at unbeatable prices.`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm self-start sm:self-auto">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <span className="text-sm font-black text-gray-800">
            {products.length} {isRtl ? 'منتج متوفر' : 'Products Available'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center gap-3 max-w-md mx-auto mb-8">
          <AlertCircle className="w-10 h-10" />
          <p className="font-bold">{isRtl ? 'فشل تحميل المنتجات' : 'Failed to load products'}</p>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-200 flex flex-col items-center gap-4 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-200/50 rounded-full flex items-center justify-center mb-2">
            <FolderOpen className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isRtl ? 'لا توجد منتجات حالياً' : 'No Products Available'}
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm">
              {isRtl 
                ? 'لم يتم إضافة أي منتجات تحت هذا التصنيف بعد. يرجى مراجعتنا لاحقاً أو استكشاف تصنيفات أخرى.' 
                : 'No products have been added under this category yet. Please check back later or explore other sections.'
              }
            </p>
          </div>
          <Link href="/" className="mt-4 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-50 hover:shadow-sm transition-all">
            {isRtl ? 'تصفح جميع الفئات' : 'Explore All Categories'}
          </Link>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
            />
          ))}
        </div>
      )}
    </main>
  );
}