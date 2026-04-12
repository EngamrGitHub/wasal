'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Mail, Lock, ArrowLeftCircle, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">{t('login_title')}</h1>
        <p className="text-muted">{t('login_subtitle')}</p>
      </div>

      <form className="space-y-5">
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

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-medium text-primary">{t('password')}</label>
            <Link href="#" className="text-xs text-accent hover:underline">{t('forgot_password')}</Link>
          </div>
          <div className="relative">
            <Lock className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted w-5 h-5`} />
            <input 
              type="password" 
              placeholder={t('password_placeholder')}
              className={`w-full bg-background border border-border rounded-2xl py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold hover:shadow-glow transition-all active:scale-[0.98]"
        >
          {t('login_button')}
        </button>
      </form>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-muted">{t('or_continue_with')}</span></div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted">
          {t('no_account')}{' '}
          <Link href={`/${locale}/register`} className="text-accent font-bold hover:underline inline-flex items-center gap-1">
             {t('register_link')}
             <UserPlus className="w-4 h-4" />
          </Link>
        </p>
      </div>
    </div>
  )
}