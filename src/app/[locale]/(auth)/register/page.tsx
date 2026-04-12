'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">{t('register_title')}</h1>
        <p className="text-muted">{t('register_subtitle')}</p>
      </div>

      <form className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
           {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary px-1">{t('full_name')}</label>
            <div className="relative">
              <User className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted w-5 h-5`} />
              <input 
                type="text" 
                placeholder={t('full_name_placeholder')}
                className={`w-full bg-background border border-border rounded-2xl py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary px-1">{t('email')}</label>
            <div className="relative">
              <Mail className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted w-5 h-5`} />
              <input 
                type="email" 
                placeholder={t('email_placeholder')}
                className={`w-full bg-background border border-border rounded-2xl py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary px-1">{t('phone')}</label>
            <div className="relative">
              <Phone className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted w-5 h-5`} />
              <input 
                type="tel" 
                placeholder={t('phone_placeholder')}
                className={`w-full bg-background border border-border rounded-2xl py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary px-1">{t('password')}</label>
            <div className="relative">
              <Lock className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted w-5 h-5`} />
              <input 
                type="password" 
                placeholder={t('password_placeholder')}
                className={`w-full bg-background border border-border rounded-2xl py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
              />
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2 space-x-reverse px-1 py-2">
            <input type="checkbox" className="mt-1 accent-accent" id="terms" />
            <label htmlFor="terms" className="text-xs text-muted leading-relaxed">
                {t('agree_to')}{' '}
                <Link href="#" className="text-accent underline">{t('terms_link')}</Link>
            </label>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold hover:shadow-glow transition-all active:scale-[0.98] mt-2"
        >
          {t('register_button')}
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted">
          {t('already_have_account')}{' '}
          <Link href={`/${locale}/login`} className="text-accent font-bold hover:underline">
             {t('login_link')}
          </Link>
        </p>
      </div>
    </div>
  )
}