'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/src/i18n/routing';
import { createClient } from '@/src/lib/supabase/client';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  image_url: string | null;
}

const dummyCategories: Category[] = [
  {
    id: 'fashion',
    name_ar: 'أزياء',
    name_en: 'Fashion',
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&q=80'
  },
  {
    id: 'electronics',
    name_ar: 'إلكترونيات',
    name_en: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80'
  },
  {
    id: 'home',
    name_ar: 'المنزل',
    name_en: 'Home',
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80'
  },
  {
    id: 'beauty',
    name_ar: 'جمال وعناية',
    name_en: 'Beauty & Care',
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80'
  },
  {
    id: 'toys',
    name_ar: 'ألعاب',
    name_en: 'Toys & Games',
    image_url: 'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?w=200&q=80'
  },
  {
    id: 'sports',
    name_ar: 'رياضة',
    name_en: 'Sports',
    image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&q=80'
  },
  {
    id: 'supermarket',
    name_ar: 'سوبرماركت',
    name_en: 'Supermarket',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'
  },
  {
    id: 'books',
    name_ar: 'كتب',
    name_en: 'Books',
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&q=80'
  }
];

export function CategoryCarousel() {
  const t = useTranslations('Categories');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient();
        if (!supabase) {
          setCategories(dummyCategories);
          return;
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 1500)
        );

        const fetchPromise = supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true });

        const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
        const { data, error } = result;

        if (error) throw error;
        if (data && data.length > 0) {
          setCategories(data as Category[]);
        } else {
          setCategories(dummyCategories);
        }
      } catch (err: any) {
        console.warn('Failed to fetch categories from Supabase, using dummy categories:', err.message);
        setCategories(dummyCategories);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      // Adjust scroll direction for RTL
      const actualDirection = isRtl 
        ? (direction === 'left' ? scrollAmount : -scrollAmount)
        : (direction === 'left' ? -scrollAmount : scrollAmount);
        
      scrollContainerRef.current.scrollTo({
        left: currentScroll + actualDirection,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-6 w-full overflow-hidden border-b border-gray-100">
        <div className="container mx-auto px-4 flex gap-4 overflow-x-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="flex flex-col items-center gap-3 shrink-0 animate-pulse">
              <div className="w-[100px] h-[100px] bg-white/50 rounded-t-[50px] rounded-b-lg border border-gray-200"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-6 w-full relative group border-b border-gray-100">
      <div className="container mx-auto px-4 relative">
        
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll('left')}
          className={`absolute z-10 top-1/2 -translate-y-1/2 ${isRtl ? '-right-4' : '-left-4'} w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100`}
        >
          {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>

        <button 
          onClick={() => scroll('right')}
          className={`absolute z-10 top-1/2 -translate-y-1/2 ${isRtl ? '-left-4' : '-right-4'} w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100`}
        >
          {isRtl ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        {/* Carousel Container */}
        <div 
          ref={scrollContainerRef}
          className="flex items-start gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category, index) => {
            // Generate a staggered delay based on index (up to 500ms)
            const delayClass = index === 0 ? '' : `delay-${Math.min((index % 5 + 1) * 100, 500)}`;
            return (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className={`flex flex-col items-center gap-3 shrink-0 snap-start group/item w-[110px] animate-slide-up ${delayClass}`}
            >
              {/* Circular Shape */}
              <div className="relative w-[80px] h-[80px] bg-white rounded-full border border-gray-100 shadow-sm overflow-hidden group-hover/item:shadow-md group-hover/item:border-primary transition-all group-hover/item:-translate-y-1">
                {category.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={category.image_url} 
                    alt={isRtl ? category.name_ar : category.name_en}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <span className="text-sm font-bold text-gray-800 text-center leading-tight group-hover/item:text-primary transition-colors px-1">
                {isRtl ? category.name_ar : category.name_en}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
