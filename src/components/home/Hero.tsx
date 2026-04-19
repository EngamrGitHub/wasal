'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { slides } from '@/constants/hero'

export function Hero() {
  const t = useTranslations('Hero');
  const locale = useLocale();

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
        <Swiper
          key={locale}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          modules={[Autoplay, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="aspect-21/9 lg:aspect-3/1"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full">
                <Image 
                  src={slide.image} 
                  alt={t(slide.title)}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Overlay with Text */}
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-6 transition-opacity group-hover:bg-black/40">
                  <div className="animate-fade-in space-y-4">
                    <h2 className="text-3xl lg:text-7xl font-black text-white leading-tight drop-shadow-lg">
                       {t(slide.title)}
                    </h2>
                    <p className="text-lg lg:text-3xl font-bold text-white/90 drop-shadow-md">
                       {t(slide.subtitle)}
                    </p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
