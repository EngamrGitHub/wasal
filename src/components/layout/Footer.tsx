import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const t = useTranslations('Footer');
  const locale = useLocale();

  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href={`/${locale}`} className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-primary">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/logo.jpg" 
                  alt="Wesal Logo" 
                  className="absolute inset-x-0 top-0 w-full h-[165%] object-cover object-top"
                />
              </div>
              <span>{locale === 'ar' ? 'وصال' : 'Wesal'}</span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              {t('brand_description')}
            </p>
            <div className="flex items-center space-x-4 space-x-reverse">
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted hover:bg-accent hover:text-white transition-all shadow-sm">
                {/* <Facebook className="w-5 h-5" /> */}
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted hover:bg-accent hover:text-white transition-all shadow-sm">
                {/* <Twitter className="w-5 h-5" /> */}
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted hover:bg-accent hover:text-white transition-all shadow-sm">
                {/* <Instagram className="w-5 h-5" /> */}
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-primary font-bold mb-6 text-lg">{t('quick_links')}</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href={`/${locale}/about`} className="text-muted hover:text-accent transition-colors">{t('about_us')}</Link></li>
              <li><Link href={`/${locale}/shop`} className="text-muted hover:text-accent transition-colors">{t('shop_now')}</Link></li>
              <li><Link href={`/${locale}/vendors`} className="text-muted hover:text-accent transition-colors">{t('become_vendor')}</Link></li>
              <li><Link href={`/${locale}/faq`} className="text-muted hover:text-accent transition-colors">{t('faq')}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-primary font-bold mb-6 text-lg">{t('categories')}</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="text-muted hover:text-accent transition-colors">{t('electronics')}</Link></li>
              <li><Link href="#" className="text-muted hover:text-accent transition-colors">{t('fashion')}</Link></li>
              <li><Link href="#" className="text-muted hover:text-accent transition-colors">{t('home_garden')}</Link></li>
              <li><Link href="#" className="text-muted hover:text-accent transition-colors">{t('beauty')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-primary font-bold mb-6 text-lg">{t('contact_us')}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3 space-x-reverse text-muted">
                <MapPin className="w-5 h-5 text-accent shrink-0" />
                <span>Cairo, Egypt</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse text-muted">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span>+20 123 456 7890</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse text-muted">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span>support@wesal.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted">
          <p>© 2026 {locale === 'ar' ? 'وصال. جميع الحقوق محفوظة.' : 'Wesal. All rights reserved.'}</p>
          <div className="flex items-center space-x-6 space-x-reverse mt-4 md:mt-0">
            <Link href="#" className="hover:text-accent transition-colors">{t('privacy_policy')}</Link>
            <Link href="#" className="hover:text-accent transition-colors">{t('terms_conditions')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
