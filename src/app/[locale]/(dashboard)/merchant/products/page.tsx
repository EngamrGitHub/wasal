'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Product } from '@/src/types';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { Loader } from '@/src/components/ui/Loader';
import { Plus, Info, X, AlertTriangle, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/src/i18n/routing';
import { createClient } from '@/src/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

export default function MerchantProductsPage() {
  const t = useTranslations('Merchant.Products');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() || '';

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 8;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Modals State
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);

  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch products
  const fetchProducts = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const from = (page - 1) * pageSize;
      const to = page * pageSize - 1;

      // Get logged-in user's store ID
      const { data: { user } } = await supabase.auth.getUser();
      const storeId = user?.user_metadata?.store_id;

      let query = supabase
        .from('products')
        .select('*, product_variants(*), product_images(*)', { count: 'exact' })
        .eq('is_active', true);

      // Filter by merchant store ID if exists
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (searchQuery) {
        query = query.or(`name_ar.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%`);
      }

      const { data, count, error: fetchError } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProducts(data as unknown as Product[] || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching merchant products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, searchQuery]);

  // Handle Edit Price
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) {
      return;
    }

    try {
      setUpdatingPrice(true);
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const firstVariant = editProduct.product_variants?.[0];
      if (!firstVariant) {
        throw new Error(locale === 'ar' ? 'لم يتم العثور على خيارات لهذا المنتج لتعديل سعرها' : 'No variant found to update price');
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('product_variants')
        .update({ price: Number(newPrice) })
        .eq('id', firstVariant.id)
        .select();

      if (updateError) throw updateError;
      if (!updatedData || updatedData.length === 0) {
        throw new Error(locale === 'ar' ? 'فشل التعديل! تأكد من وجود صلاحيات RLS للتعديل في قاعدة البيانات.' : 'Update failed! Check database RLS policies.');
      }

      // Update local state reactive
      setProducts(prev => prev.map(p => {
        if (p.id === editProduct.id) {
          const updatedVariants = [...p.product_variants];
          if (updatedVariants[0]) {
            updatedVariants[0] = { ...updatedVariants[0], price: Number(newPrice) };
          }
          return { ...p, product_variants: updatedVariants };
        }
        return p;
      }));

      setEditProduct(null);
      setNewPrice('');
    } catch (err: any) {
      alert(locale === 'ar' ? `خطأ أثناء تحديث السعر: ${err.message}` : `Error updating price: ${err.message}`);
    } finally {
      setUpdatingPrice(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      setDeleting(true);
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteProduct.id);

      if (deleteError) {
        // Handle Foreign Key Violations gracefully by soft-deactivating the product
        if (deleteError.code === '23503') {
          const { error: deactivateError } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', deleteProduct.id);

          if (deactivateError) throw deactivateError;

          // Alert user gracefully
          alert(locale === 'ar'
            ? 'تم أرشفة وإخفاء هذا المنتج بنجاح. (نظراً لارتباطه بعمليات شراء سابقة للعملاء، قمنا بإلغاء تفعيله بدلاً من حذفه نهائياً للحفاظ على سجل مبيعاتك).'
            : 'Product archived and hidden successfully. (Since it is linked to previous customer orders, we have deactivated it instead of permanently deleting it to preserve your sales history).'
          );
        } else {
          throw deleteError;
        }
      }

      // Update local state reactive
      setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
      setTotalCount(prev => Math.max(0, prev - 1));

      // Adjust page if we deleted the last item on the page
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        // Re-fetch to keep pagination size consistent
        fetchProducts(currentPage);
      }

      setDeleteProduct(null);
    } catch (err: any) {
      alert(locale === 'ar' ? `خطأ أثناء حذف المنتج: ${err.message}` : `Error deleting product: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && products.length === 0) {
    return <Loader size="lg" text={tCommon('loading') || "Loading your products..."} />;
  }

  // Styles helper for status badges
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-success/10 text-success border-success/20';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'REJECTED': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
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
        <div className="space-y-8">
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="relative flex flex-col">
                <ProductCard 
                  product={product} 
                  isMerchant={true}
                  onEditPrice={(productId, currentPrice) => {
                    setEditProduct(product);
                    setNewPrice(currentPrice.toString());
                  }}
                  onDelete={() => setDeleteProduct(product)}
                  renderBadge={(status) => (
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusStyle(status)}`}>
                      {tCommon(`status.${status}`) || status}
                    </span>
                  )}
                />

                {/* If product is rejected, show the reason clearly */}
                {product.approval_status === 'REJECTED' && product.rejection_reason && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-700">{locale === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}</p>
                      <p className="text-xs text-red-600 mt-0.5">{product.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-white"
                title={locale === 'ar' ? 'الصفحة السابقة' : 'Previous Page'}
              >
                {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-[40px] px-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center ${
                      currentPage === page
                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-white"
                title={locale === 'ar' ? 'الصفحة التالية' : 'Next Page'}
              >
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Price Modal (Sleek Glassmorphism Modal) */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">
                {locale === 'ar' ? 'تعديل سعر المنتج' : 'Edit Product Price'}
              </h3>
              <button 
                onClick={() => setEditProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdatePrice} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">
                  {locale === 'ar' ? 'اسم المنتج' : 'Product Name'}
                </p>
                <p className="text-base font-bold text-gray-800 font-sans">
                  {locale === 'ar' ? editProduct.name_ar : editProduct.name_en}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-500 font-semibold mb-2">
                  {locale === 'ar' ? 'السعر الجديد ($)' : 'New Price ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-lg text-gray-900"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updatingPrice}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {updatingPrice && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {tCommon('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Sleek Danger Glassmorphism Modal) */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-xl font-black">
                  {locale === 'ar' ? 'حذف المنتج' : 'Delete Product'}
                </h3>
              </div>
              <button 
                onClick={() => setDeleteProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600 font-medium leading-relaxed">
                {locale === 'ar' 
                  ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟ سيؤدي ذلك أيضاً إلى حذف جميع خياراته وصوره التابعة له من قاعدة البيانات ولا يمكن التراجع عن هذا الإجراء.' 
                  : 'Are you sure you want to permanently delete this product? This action will also delete all associated variants and images from the database and cannot be undone.'
                }
              </p>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold mb-0.5">
                  {locale === 'ar' ? 'المنتج المحدد للتدمير' : 'Product to delete'}
                </p>
                <p className="text-base font-bold text-gray-800">
                  {locale === 'ar' ? deleteProduct.name_ar : deleteProduct.name_en}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeleteProduct(null)}
                  disabled={deleting}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={deleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {deleting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {locale === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
