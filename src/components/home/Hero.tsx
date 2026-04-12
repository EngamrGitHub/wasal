'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export function Hero() {
  const t = useTranslations('Hero');
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <div className={`text-${locale === 'ar' ? 'right' : 'left'} space-y-8 animate-fade-in`}>
          <div className="inline-flex items-center space-x-2 space-x-reverse bg-accent/10 border border-accent/20 px-4 py-2 rounded-full text-accent font-medium text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{t('badge')}</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-primary leading-[1.1]">
            {t('title_part1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
              {t('title_highlight')}
            </span>
          </h1>

          <p className={`text-xl text-muted max-w-xl ${locale === 'ar' ? 'ml-auto' : 'mr-auto'} leading-relaxed`}>
            {t('subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-start space-x-4 space-x-reverse">
            <Link 
              href={`/${locale}/products`} 
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:shadow-glow hover:-translate-y-1 transition-all flex items-center space-x-2 space-x-reverse shadow-premium"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{t('cta_shop')}</span>
            </Link>
            
            <Link 
              href={`/${locale}/vendor/register`} 
              className="px-8 py-4 bg-surface text-primary border border-border rounded-2xl font-bold text-lg hover:bg-background transition-all flex items-center space-x-2 space-x-reverse"
            >
              <span>{t('cta_vendor')}</span>
              <ArrowLeft className={`w-5 h-5 ${locale === 'en' ? 'rotate-180' : ''}`} />
            </Link>
          </div>

          {/* Stats */}
          <div className="pt-8 grid grid-cols-3 gap-8 border-t border-border">
            <div>
              <div className="text-3xl font-bold text-primary">+50k</div>
              <div className="text-muted text-sm">{t('stat_products')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">+10k</div>
              <div className="text-muted text-sm">{t('stat_customers')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">+500</div>
              <div className="text-muted text-sm">{t('stat_vendors')}</div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative lg:block hidden animate-fade-in group">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent blur-3xl rounded-full" />
          <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-surface shadow-premium group-hover:scale-[1.02] transition-transform duration-500">
            <div className="bg-muted/10 w-full h-[600px] flex items-center justify-center">
                <span className="text-muted text-sm">Hero Image - Shopping Mockup</span>
            </div>
          </div>
          
          {/* Floating Card */}
          <div className={`absolute -bottom-6 ${locale === 'ar' ? '-left-6' : '-right-6'} bg-surface/90 backdrop-blur-md p-6 rounded-3xl shadow-premium border border-border animate-bounce-slow`}>
             <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <span className="text-success font-bold">✓</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-primary">{t('notification')}</div>
                  <div className="text-xs text-muted font-medium">{t('notification_time')}</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
