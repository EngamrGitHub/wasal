'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/src/types';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { ProductService } from '@/src/services/productService';
import { useLocale, useTranslations } from 'next-intl';
import { X, Percent, Truck, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminProductsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const tAdmin = useTranslations('Admin.Products');
  const tCommon = useTranslations('Common');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Markup & Shipping Approval States
  const [approvingProduct, setApprovingProduct] = useState<Product | null>(null);
  const [commissionPercent, setCommissionPercent] = useState<number>(10);
  const [shippingSurcharge, setShippingSurcharge] = useState<number>(40);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);

  // For demonstration: load pending products.
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
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

  const submitApproval = async () => {
    if (!approvingProduct) return;
    try {
      setIsSubmittingApproval(true);
      
      const updatedVariants = approvingProduct.product_variants.map(v => {
        const basePrice = Number(v.price || 0);
        const markupPrice = Math.round(basePrice * (1 + commissionPercent / 100) + shippingSurcharge);
        return {
          id: v.id,
          price: markupPrice
        };
      });

      await ProductService.approveProductWithMarkup(approvingProduct.id, updatedVariants);
      
      // Remove from pending list reactive
      setProducts(prev => prev.filter(p => p.id !== approvingProduct.id));
      setApprovingProduct(null);
      
      alert(locale === 'ar' ? 'تمت الموافقة على المنتج وإضافة العمولات ونشره بنجاح!' : 'Product approved, marked up, and published successfully!');
    } catch (error) {
      console.error(error);
      alert(locale === 'ar' ? 'فشل إكمال عملية الموافقة' : 'Failed to complete approval process');
    } finally {
      setIsSubmittingApproval(false);
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
                  onClick={() => setApprovingProduct(product)}
                  className="w-full bg-success text-white font-bold py-2 rounded-lg hover:bg-success/90 transition shadow-sm"
                >
                  {locale === 'ar' ? 'موافقة وتحديد السعر' : 'Approve & Markup'}
                </button>
                <button 
                  onClick={() => handleReject(product.id)}
                  className="w-full bg-error text-white font-bold py-2 rounded-lg hover:bg-error/90 transition shadow-sm"
                >
                  {locale === 'ar' ? 'رفض' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Price Markup & Shipping Surcharge Approval Modal */}
      {approvingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-100 shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {locale === 'ar' ? 'تعديل هوامش الربح ونشر المنتج' : 'Approve & Mark Up Product'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {locale === 'ar' ? 'اضبط عمولة الإدارة وتكلفة الشحن المضافة لسعر الجمهور.' : 'Configure administrative markups and shipping premiums.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setApprovingProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Product Info Summary */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-0.5">
                    {locale === 'ar' ? 'المنتج المختار للمراجعة' : 'Product under review'}
                  </p>
                  <h4 className="text-base font-bold text-gray-900">
                    {locale === 'ar' ? approvingProduct.name_ar : approvingProduct.name_en}
                  </h4>
                </div>
                {approvingProduct.product_images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={approvingProduct.product_images[0].image_url} 
                    alt="thumbnail" 
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                  />
                )}
              </div>

              {/* Input parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Commission input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-primary" />
                    {locale === 'ar' ? 'نسبة عمولة الإدارة (%)' : 'Admin Commission (%)'}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(Number(e.target.value))}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:outline-none font-bold text-gray-900 text-lg"
                    />
                    <span className={`absolute ${isRtl ? 'left-4' : 'right-4'} text-xs font-black text-gray-400`}>%</span>
                  </div>
                </div>

                {/* Shipping Surcharge input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-primary" />
                    {locale === 'ar' ? 'باقي سعر الشحن المضاف للسعر (EGP)' : 'Shipping Surcharge (EGP)'}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={shippingSurcharge}
                      onChange={(e) => setShippingSurcharge(Number(e.target.value))}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:outline-none font-bold text-gray-900 text-lg"
                    />
                    <span className={`absolute ${isRtl ? 'left-4' : 'right-4'} text-xs font-black text-gray-400`}>EGP</span>
                  </div>
                </div>
              </div>

              {/* Price Preview List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-success" />
                  {locale === 'ar' ? 'جدول معاينة الأسعار للجمهور' : 'Final Customer Pricing Preview'}
                </h4>

                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse text-xs text-left" dir={isRtl ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100 uppercase tracking-wider">
                        <th className="px-4 py-3 text-start">{locale === 'ar' ? 'اللون / المقاس' : 'Variant specs'}</th>
                        <th className="px-4 py-3 text-center">{locale === 'ar' ? 'سعر التاجر' : 'Merchant Price'}</th>
                        <th className="px-4 py-3 text-center">{locale === 'ar' ? 'هامش الزيادة' : 'Added Surcharges'}</th>
                        <th className="px-4 py-3 text-end">{locale === 'ar' ? 'سعر الجمهور النهائي' : 'Final Public Price'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-sans text-sm">
                      {approvingProduct.product_variants?.map((v, i) => {
                        const originalPrice = Number(v.price || 0);
                        const commissionAmount = Math.round(originalPrice * (commissionPercent / 100));
                        const totalAdded = commissionAmount + shippingSurcharge;
                        const finalPrice = originalPrice + totalAdded;

                        return (
                          <tr key={v.id || i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-start font-bold text-gray-900">
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] uppercase font-mono mr-1">
                                {v.sku || `V-${i+1}`}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-400 font-bold">{originalPrice} EGP</td>
                            <td className="px-4 py-3 text-center text-success font-black">+{totalAdded} EGP</td>
                            <td className="px-4 py-3 text-end text-primary font-black text-base">{finalPrice} EGP</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setApprovingProduct(null)}
                disabled={isSubmittingApproval}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                onClick={submitApproval}
                disabled={isSubmittingApproval}
                className="flex-1 py-3 bg-success hover:bg-success/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isSubmittingApproval && <Loader2 className="w-4 h-4 animate-spin" />}
                {locale === 'ar' ? 'اعتماد الموافقة ونشر الأسعار' : 'Approve & Publish Price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
