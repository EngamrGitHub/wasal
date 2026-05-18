import { Link } from '@/src/i18n/routing';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/src/types';
import { useLocale } from 'next-intl';

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
  renderBadge 
}: ProductCardProps) {
  const locale = useLocale();

  // Extract from product object if provided, otherwise fallback to direct props
  const productId = product?.id || id || '';
  
  // Handle complex product structure from ERD
  const defaultVariant = product?.product_variants?.[0];
  const defaultImage = product?.product_images?.find(img => img.is_main)?.image_url 
    || product?.product_images?.[0]?.image_url 
    || defaultVariant?.image_url;

  const displayPrice = product ? (defaultVariant?.price || 0) : (price || 0);
  const displayImage = product ? (defaultImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80') : (image || '');
  
  // Title logic for both old (title.ar) and new (name_ar) schemas
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
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
        <Image
          src={displayImage}
          alt={displayTitle || 'Product Image'}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            {badge}
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <Link href={`/product/${productId}`} className="flex-1">
          <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-1 mb-4">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold text-gray-700">{rating}</span>
            <span className="text-xs text-gray-400">({reviews})</span>
          </div>
        </Link>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 mb-0.5">Price</span>
            <span className="text-lg font-black text-gray-900">${displayPrice.toFixed(2)}</span>
          </div>
          <Link href={`/cart?productId=${productId}`} className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-3 rounded-xl transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
