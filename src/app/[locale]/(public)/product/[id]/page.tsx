'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useRouter } from '@/src/i18n/routing';
import { createClient } from '@/src/lib/supabase/client';
import { Product, ProductVariant, ProductImage } from '@/src/types';
import { Loader } from '@/src/components/ui/Loader';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const tCommon = useTranslations('Common');
  const isRtl = locale === 'ar';

  // State Management
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction State
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch product with variants and images via API to bypass RLS on colors/sizes
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Product not found');
        }
        const productData = await response.json();

        const typedProduct = productData as unknown as Product;
        setProduct(typedProduct);

        // Set default variant & main image
        const defaultVar = typedProduct.product_variants?.[0] || null;
        setSelectedVariant(defaultVar);

        const defaultImg = typedProduct.product_images?.find(img => img.is_main)?.image_url 
          || typedProduct.product_images?.[0]?.image_url 
          || defaultVar?.image_url 
          || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
        
        setActiveImage(defaultImg);

        // Fetch category separately for robustness
        if (typedProduct.category_id) {
          const supabase = createClient();
          const { data: catData } = await supabase
            .from('categories')
            .select('*')
            .eq('id', typedProduct.category_id)
            .single();
          if (catData) setCategory(catData);
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductDetails();
  }, [id]);

  // Handle Variant Selection
  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.image_url) {
      setActiveImage(variant.image_url);
    }
  };

  // Add to Cart Logic
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    // Save to localStorage
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant.id,
      quantity: quantity
    };
    localStorage.setItem('wesal_cart', JSON.stringify(cartItem));
    window.dispatchEvent(new Event('wesal_cart_updated'));

    // Show quick success state and redirect to checkout cart
    setCartSuccess(true);
    setTimeout(() => {
      setCartSuccess(false);
      router.push(`/cart?productId=${product.id}&variantId=${selectedVariant.id}&quantity=${quantity}`);
    }, 800);
  };

  if (loading) {
    return <Loader size="lg" text={isRtl ? 'جاري تحميل تفاصيل المنتج...' : 'Loading product details...'} />;
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 space-y-4">
          <div className="text-red-500 font-bold text-lg">
            {isRtl ? 'عذراً، حدث خطأ ما' : 'Sorry, an error occurred'}
          </div>
          <p className="text-gray-600 text-sm">{error || (isRtl ? 'المنتج غير موجود' : 'Product not found')}</p>
          <Link href="/" className="mt-4 inline-block bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-primary/95 transition-colors">
            {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  // Get all unique images for the gallery
  const galleryImages: string[] = [];
  if (product.product_images) {
    product.product_images.forEach(img => {
      if (img.image_url && !galleryImages.includes(img.image_url)) {
        galleryImages.push(img.image_url);
      }
    });
  }
  // Add variant images if not already in gallery
  if (product.product_variants) {
    product.product_variants.forEach(v => {
      if (v.image_url && !galleryImages.includes(v.image_url)) {
        galleryImages.push(v.image_url);
      }
    });
  }
  // Ensure we have at least one image
  if (galleryImages.length === 0) {
    galleryImages.push(activeImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80');
  }

  const displayTitle = isRtl ? (product.name_ar || product.name_en) : (product.name_en || product.name_ar);
  const displayDesc = isRtl ? (product.description_ar || product.description_en) : (product.description_en || product.description_ar);
  const displayPrice = selectedVariant?.price || 0;
  const fakeOriginalPrice = (selectedVariant as any)?.fake_original_price || 0;
  const fakeRating = (product as any)?.fake_rating || 4.7;
  const fakeReviews = (product as any)?.fake_reviews || 142;
  const discountPct = (product as any)?.fake_discount_pct || 0;
  const inStock = (selectedVariant?.stock_quantity || 0) > 0;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-medium">
        <Link href="/" className="hover:text-primary transition-colors">
          {isRtl ? 'الرئيسية' : 'Home'}
        </Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/categories/${category.id}`} className="hover:text-primary transition-colors text-primary font-semibold">
              {isRtl ? category.name_ar : category.name_en}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-bold truncate max-w-[200px]">
          {displayTitle}
        </span>
      </nav>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white rounded-3xl p-6 lg:p-10 border border-gray-100 shadow-sm">
        
        {/* RIGHT COLUMN: Image & Gallery (Matches RTL layout) */}
        <div className="lg:col-span-6 flex flex-col gap-6 order-1 lg:order-2">
          {/* Main Hero Image */}
          <div className="relative aspect-[4/4] md:aspect-[4/3] lg:aspect-[4/4] bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden group shadow-inner">
            <Image
              src={activeImage}
              alt={displayTitle}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {product.approval_status === 'PENDING' && (
              <div className="absolute top-4 left-4 bg-yellow-500 text-white font-bold px-3 py-1 rounded-lg text-xs shadow-md">
                {isRtl ? 'معلق للموافقة' : 'Pending Approval'}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {galleryImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {galleryImages.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`relative w-20 h-20 rounded-2xl border bg-white overflow-hidden shrink-0 transition-all duration-300 ${
                    activeImage === imgUrl 
                      ? 'border-primary ring-2 ring-primary/20 scale-105' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt={`Gallery item ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LEFT COLUMN: Product Content Info */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-8 order-2 lg:order-1" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="space-y-6">
            
            {/* Category Tag & Rating */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                {category && (
                  <Link href={`/categories/${category.id}`} className="bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs px-3 py-1.5 rounded-full transition-all">
                    {isRtl ? category.name_ar : category.name_en}
                  </Link>
                )}
                {discountPct > 0 && (
                  <span className="bg-red-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                    -{discountPct}%
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-black text-yellow-700">{fakeRating}</span>
                <span className="text-xs text-yellow-600/80">({fakeReviews})</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
              {displayTitle}
            </h1>

            {/* Price section (Dynamically changes with variant selection!) */}
            <div className="flex flex-col gap-1 py-4 border-y border-gray-100">
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-black text-red-600">
                  {displayPrice} {isRtl ? 'ج.م' : 'EGP'}
                </span>
                {fakeOriginalPrice > 0 && (
                  <span className="text-lg text-gray-400 line-through font-semibold">
                    {fakeOriginalPrice} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                )}
              </div>
              {selectedVariant && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border w-fit ${
                  inStock ? 'bg-success/5 text-success border-success/10' : 'bg-red-50 text-red-500 border-red-100'
                }`}>
                  {inStock 
                    ? (isRtl ? `متوفر في المخزون (${selectedVariant.stock_quantity})` : `In Stock (${selectedVariant.stock_quantity})`)
                    : (isRtl ? 'غير متوفر مؤقتاً' : 'Out of Stock')
                  }
                </span>
              )}
            </div>

            {/* Product Description */}
            <div className="prose prose-sm text-gray-600 leading-relaxed">
              <p>{displayDesc || (isRtl ? 'لا يوجد وصف متاح لهذا المنتج حالياً.' : 'No description available for this product.')}</p>
            </div>

            {/* DYNAMIC VARIANT SELECTOR (Colors/Sizes Price Switcher) */}
            {product.product_variants && product.product_variants.length > 1 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-gray-800">
                  {isRtl ? 'اختر النوع / البديل المتاح:' : 'Select Available Type/Variant:'}
                </h4>
                
                <div className="flex flex-wrap gap-3">
                  {product.product_variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const colorHex = v.colors?.hex_code;
                    const colorName = v.colors?.name;
                    const sizeName = v.sizes?.name;
                    return (
                      <button
                        key={v.id}
                        onClick={() => selectVariant(v)}
                        className={`px-4 py-3 rounded-2xl border text-sm font-bold transition-all duration-200 text-left flex flex-col min-w-[120px] ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {colorHex && (
                            <span 
                              className="w-4 h-4 rounded-full border border-gray-200 shadow-sm shrink-0" 
                              style={{ backgroundColor: colorHex }} 
                              title={colorName || ''}
                            />
                          )}
                          <span className="text-xs text-gray-500 font-semibold truncate max-w-[100px]">
                            {colorName || sizeName ? [colorName, sizeName].filter(Boolean).join(' - ') : (v.sku || `Option ${v.id.substring(0, 4)}`)}
                          </span>
                        </div>
                        <span className="text-base text-gray-900">{v.price.toFixed(2)} {isRtl ? 'ج.م' : 'EGP'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              
              {/* Quantity input */}
              <div className="flex items-center justify-between border border-gray-200 rounded-2xl p-2 bg-white sm:w-36">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-black text-gray-800 w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 py-4 px-8 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-lg ${
                  inStock 
                    ? 'bg-primary hover:bg-primary/90 shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95' 
                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isRtl ? 'إضافة إلى سلة المشتريات' : 'Add to Shopping Cart'}
              </button>
            </div>

            {/* Cart Success Alert Toast */}
            {cartSuccess && (
              <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl text-sm font-bold text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                {isRtl ? '🎉 تم إضافة المنتج بنجاح إلى سلتك!' : '🎉 Product successfully added to your cart!'}
              </div>
            )}

          </div>

          {/* E-Commerce trust signals (Sleek side badges matching image) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
              <Truck className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">{isRtl ? 'توصيل سريع' : 'Fast Delivery'}</p>
                <p className="text-[10px] text-gray-400">{isRtl ? 'خلال 24-48 ساعة' : 'Within 24-48 hrs'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
              <RotateCcw className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">{isRtl ? 'إرجاع مجاني' : 'Free Returns'}</p>
                <p className="text-[10px] text-gray-400">{isRtl ? 'مرن خلال 14 يوماً' : 'Easy within 14 days'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">{isRtl ? 'دفع آمن 100%' : '100% Secure'}</p>
                <p className="text-[10px] text-gray-400">{isRtl ? 'حماية بياناتك مضمونة' : 'Your data is safe'}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
