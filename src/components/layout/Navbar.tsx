'use client'

import Link from 'next/link'
import { ShoppingCart, User, Search, Menu, Globe } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

export function Navbar() {
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath || `/${newLocale}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center space-x-2 space-x-reverse group">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
            <Globe className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-primary">
            TUJARIA
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className={`absolute ${locale === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted w-4 h-4`} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              className={`w-full bg-background border border-border rounded-full py-2.5 ${locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg hover:bg-background transition-colors text-sm font-bold text-foreground"
          >
            <Globe className="w-4 h-4 text-accent" />
            <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <button className="p-2 hover:bg-background rounded-full transition-colors relative group">
            <ShoppingCart className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center rounded-full font-bold">0</span>
          </button>
          
          <Link href={`/${locale}/login`} className="flex items-center space-x-2 space-x-reverse px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium text-sm shadow-premium">
            <User className="w-4 h-4" />
            <span>{t('login')}</span>
          </Link>

          <button className="md:hidden p-2 text-primary">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}
