import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

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
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted hover:bg-accent hover:text-white transition-all shadow-sm">
                <TwitterIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted hover:bg-accent hover:text-white transition-all shadow-sm">
                <InstagramIcon className="w-5 h-5" />
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
