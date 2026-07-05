import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
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
                  src="/logo.png" 
                  alt="Wafir Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span>{locale === 'ar' ? 'وافر' : 'Wafir'}</span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              {t('brand_description')}
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://www.facebook.com/profile.php?id=61591953140580" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-90 transition-all shadow-sm"
                title="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a 
                href="https://wa.me/201024380714" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:opacity-90 transition-all shadow-sm"
                title="WhatsApp: 01024380714"
              >
                <WhatsAppIcon className="w-5 h-5" />
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
                <a href="tel:+201024380714" className="hover:text-accent transition-colors">01024380714</a>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse text-muted">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span>support@wesal.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted">
          <p>© 2026 {locale === 'ar' ? 'وافر. جميع الحقوق محفوظة.' : 'Wafir. All rights reserved.'}</p>
          <div className="flex items-center space-x-6 space-x-reverse mt-4 md:mt-0">
            <Link href="#" className="hover:text-accent transition-colors">{t('privacy_policy')}</Link>
            <Link href="#" className="hover:text-accent transition-colors">{t('terms_conditions')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
