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
  image_url: string;
}

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
        if (!supabase) return;

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data) setCategories(data as Category[]);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
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
      <section className="bg-[#eef5f4] py-8 w-full overflow-hidden">
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
    <section className="bg-[#eef5f4] py-8 w-full relative group">
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
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="flex flex-col items-center gap-3 shrink-0 snap-start group/item w-[110px]"
            >
              {/* Arch Dome Shape */}
              <div className="relative w-[100px] h-[100px] bg-white rounded-t-[50px] rounded-b-xl border-2 border-white shadow-sm overflow-hidden group-hover/item:shadow-md transition-all group-hover/item:-translate-y-1">
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
