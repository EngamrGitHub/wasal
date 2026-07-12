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
      <div className="relative w-full rounded-xl overflow-hidden shadow-sm">
        <Swiper
          key={locale}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          modules={[Autoplay, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          className="h-[200px] sm:h-[280px] md:h-[340px] lg:h-[380px]"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full">
                <Image 
                  src={slide.image} 
                  alt={t(slide.title) || "Hero Image"}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Overlay with Text */}
                <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-center p-6 transition-opacity group-hover:bg-black/40">
                  <div className="space-y-4">
                    <h2 className="animate-slide-up text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg">
                       {t(slide.title)}
                    </h2>
                    <p className="animate-slide-up delay-100 text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white/90 drop-shadow-md">
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
