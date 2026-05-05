'use client';

import React from 'react';
import { Product } from '@/src/types';
import { useLocaleString } from '@/src/hooks/useLocaleString';
import { useTranslations } from 'next-intl';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  renderBadge?: (status: string) => React.ReactNode;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  renderBadge 
}) => {
  const { getLocalizedString } = useLocaleString();
  const t = useTranslations('Common');

  // Read texts based on current locale
  const title = getLocalizedString(product.title);
  const description = getLocalizedString(product.description);

  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white flex flex-col h-full">
      <div className="aspect-square bg-gray-100 rounded-lg mb-4 w-full object-cover">
        {product.images && product.images.length > 0 ? (
           <img src={product.images[0]} alt={title} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            {t('no_image') || 'No Image'}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{title}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-primary font-black text-xl">${product.price.toFixed(2)}</span>
        {renderBadge && renderBadge(product.approval_status)}
      </div>
      
      {onAddToCart && (
        <button 
          onClick={() => onAddToCart(product)}
          className="mt-4 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition"
        >
          {t('add_to_cart') || 'Add to Cart'}
        </button>
      )}
    </div>
  );
};
