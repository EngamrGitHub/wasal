import { Link } from '@/src/i18n/routing';
import Image from 'next/image';
import { ShoppingCart, Star, Trash2 } from 'lucide-react';
import { Product } from '@/src/types';
import { useLocale } from 'next-intl';
import { useState, useCallback } from 'react';

interface ProductCardProps {
  product?: Product;
  id?: string;
  title?: any;
  name_ar?: string;
  name_en?: string;
  price?: number;
  image?: string;
  rating?: number;
  reviews?: number;
  renderBadge?: (status: string) => React.ReactNode;
  isMerchant?: boolean;
  onEditPrice?: (productId: string, currentPrice: number) => void;
  onDelete?: (productId: string) => void;
}

export function ProductCard({ 
  product, 
  id, 
  title, 
  name_ar,
  name_en,
  price, 
  image, 
  rating = 4.5, 
  reviews = 128,
  renderBadge,
  isMerchant = false,
  onEditPrice,
  onDelete
}: ProductCardProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [isFavorite, setIsFavorite] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  const productId = product?.id || id || '';
  const defaultVariant = product?.product_variants?.[0];
  const defaultImage = product?.product_images?.find(img => img.is_main)?.image_url 
    || product?.product_images?.[0]?.image_url 
    || defaultVariant?.image_url;

  const displayPrice = product ? (defaultVariant?.price || 0) : (price || 0);
  const fakeOriginalPrice = (defaultVariant as any)?.fake_original_price || 0;
  const discountPct = (product as any)?.fake_discount_pct || 0;
  const fakeRating = (product as any)?.fake_rating || rating;
  const fakeReviews = (product as any)?.fake_reviews || reviews;

  const displayImage = product ? (defaultImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80') : (image || '');
  
  let displayTitle = '';
  if (product) {
    displayTitle = locale === 'ar' ? (product.name_ar || (product as any).title?.ar) : (product.name_en || (product as any).title?.en);
  } else if (name_ar || name_en) {
    displayTitle = locale === 'ar' ? (name_ar || '') : (name_en || '');
  } else if (title) {
    displayTitle = locale === 'ar' ? title.ar : title.en;
  }

  const badge = renderBadge && product?.approval_status ? renderBadge(product.approval_status) : null;

  return (
    <div className="group bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full rounded-sm overflow-hidden relative">
      
      {/* Discount Badge */}
      {discountPct > 0 && !isMerchant && (
        <div className={`absolute top-2 ${isRtl ? 'right-2' : 'left-2'} z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm`}>
          -{discountPct}%
        </div>
      )}

      {/* Status Badge (merchant mode) */}
      {badge ? (
        <div className="absolute top-0 left-0 z-10 w-full flex justify-between items-start">
          <div className="bg-[#0f4d81] text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
            {badge}
          </div>
        </div>
      ) : null}

      {/* Heart Icon (Favorite) */}
      <button 
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorite(!isFavorite); }}
        className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all ${isFavorite ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500 hover:bg-white hover:scale-110'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={isFavorite ? 0 : 2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>

      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden pt-4">
        <Link href={`/product/${productId}`}>
          <Image
            src={imgError ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' : displayImage}
            alt={displayTitle || 'Product Image'}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            onError={handleImgError}
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {/* Color Swatches */}
        {(() => {
          const variantsWithColors = product?.product_variants?.filter(v => v.colors?.hex_code) || [];
          if (variantsWithColors.length === 0) return null;
          const uniqueColors = Array.from(new Map(variantsWithColors.map(v => [v.colors!.hex_code, v])).values());
          return (
            <div className={`absolute bottom-2 ${isRtl ? 'right-2' : 'left-2'} flex flex-col items-center`}>
              <div className="flex -space-x-1 mb-1" dir="ltr">
                {uniqueColors.slice(0, 3).map((v, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: v.colors!.hex_code }}></div>
                ))}
              </div>
              {uniqueColors.length > 3 && (
                <span className="text-[10px] text-gray-600 font-bold bg-white/90 px-1 rounded">+{uniqueColors.length - 3}</span>
              )}
            </div>
          );
        })()}
      </div>
      
      {/* Content Container */}
      <div className="p-2 md:p-3 flex flex-col flex-1 border-t border-gray-100">
        <Link href={`/product/${productId}`} className="flex-1">
          {/* Title */}
          <h3 className="text-xs md:text-sm text-gray-700 line-clamp-2 leading-snug hover:text-blue-600 transition-colors">
            {displayTitle}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mt-2 mb-2">
            <span className="text-xs text-gray-500">({fakeReviews})</span>
            <span className="text-xs font-bold text-gray-700">{fakeRating}</span>
            <Star className="w-3 h-3 fill-green-600 text-green-600" />
          </div>
          
          {/* Price Section */}
          <div className="flex flex-col mt-auto gap-0.5">
            {/* Crossed-out fake original price */}
            {fakeOriginalPrice > 0 && !isMerchant && (
              <span className="text-[10px] text-gray-500 line-through font-semibold">
                {fakeOriginalPrice} {locale === 'ar' ? 'ج.م' : 'EGP'}
              </span>
            )}
            <div className="flex items-end gap-0.5 md:gap-1 flex-wrap">
              <span className="text-[9px] md:text-[10px] text-gray-500 pb-0.5">{locale === 'ar' ? 'جنيه' : 'EGP'}</span>
              <span className="text-base md:text-lg font-black text-black leading-none">{displayPrice}</span>
            </div>
          </div>
          
          {/* Wafir Express Badge */}
          <div className="flex items-center gap-1 mt-2">
             <span className="text-[10px] font-black italic text-black bg-primary px-1.5 py-0.5 rounded-sm">wafir</span>
             <span className="text-[10px] font-bold text-blue-600">express</span>
          </div>
        </Link>

        {/* Merchant Actions Overlay */}
        {isMerchant && (
          <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-2 flex items-center justify-between translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button 
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                onEditPrice?.(productId, displayPrice);
              }} 
              className="bg-primary/10 text-primary px-3 py-1.5 rounded-md font-bold text-xs hover:bg-primary hover:text-white transition"
            >
              {locale === 'ar' ? 'تعديل السعر' : 'Edit'}
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                onDelete?.(productId);
              }} 
              className="bg-red-50 text-red-500 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

