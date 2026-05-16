'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Search, Home, Store, Settings2, Menu, X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

export function Navbar() {
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath || `/${newLocale}`);
  };

  const navItems = [
    { icon: ShoppingCart, label: t('cart'), href: `/${locale}/cart`, badge: 2 },
    { icon: Settings2, label: t('admin'), href: `/${locale}/admin` },
    { icon: Store, label: t('merchants'), href: `/${locale}/merchant` },
    { icon: Home, label: t('home'), href: `/${locale}` },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      {/* Main Navbar */}
      <div className="container mx-auto px-4 py-4 lg:py-0 lg:h-24 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
        
        {/* Top Row for Mobile: Hamburger, Logo, Actions */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-primary transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href={`/${locale}`} className="shrink-0 flex-1 lg:flex-none text-center lg:text-start">
            <span className="text-3xl lg:text-4xl font-black tracking-tight text-primary uppercase">
              TUJARIA
            </span>
          </Link>

          {/* Mobile Quick Actions */}
          <div className="flex lg:hidden items-center gap-2">
            <button 
              onClick={toggleLanguage} 
              className="p-2 text-sm font-bold text-gray-600 hover:text-primary"
            >
              {locale === 'ar' ? 'EN' : 'AR'}
            </button>
            <Link href={`/${locale}/cart`} className="relative p-2 text-gray-600 hover:text-primary">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold border border-white">
                2
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full lg:flex-1 max-w-2xl order-3 lg:order-0">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              className={`w-full h-12 bg-white border-2 border-primary/20 rounded-full ${locale === 'ar' ? 'pr-6 pl-24' : 'pl-6 pr-24'} text-sm focus:outline-none focus:border-primary transition-all`}
            />
            <button className={`absolute ${locale === 'ar' ? 'left-1' : 'right-1'} h-10 px-6 lg:px-8 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity`}>
              {t('search_button')}
            </button>
          </div>
        </div>

        {/* Desktop Actions Icons */}
        <div className="hidden lg:flex items-center gap-6">
          {navItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className="flex flex-col items-center gap-1 group relative transition-colors hover:text-primary"
            >
              <div className="relative p-2 rounded-xl group-hover:bg-primary/5 transition-colors">
                <item.icon className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
              </div>
              <span className="text-[12px] font-bold text-gray-600 group-hover:text-primary whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}
          
          {/* Desktop Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-2 rounded-xl group-hover:bg-primary/5">
              <span className="text-xl font-bold text-gray-500 group-hover:text-primary">
                {locale === 'ar' ? 'EN' : 'AR'}
              </span>
            </div>
            <span className="text-[12px] font-bold text-gray-600 group-hover:text-primary">
              {t('language_label')}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white absolute w-full left-0 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors text-gray-600 hover:text-primary"
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="font-bold">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
