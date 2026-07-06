'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Search, Home, Store, Settings2, Menu, X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { NotificationDropdown } from './NotificationDropdown'

export function Navbar() {
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  React.useEffect(() => {
    const updateCartCount = () => {
      const saved = localStorage.getItem('wesal_cart');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const totalQty = parsed.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
            setCartCount(totalQty);
          } else {
            setCartCount(Number(parsed.quantity || 1));
          }
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener('wesal_cart_updated', updateCartCount);
    return () => window.removeEventListener('wesal_cart_updated', updateCartCount);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/${locale}`);
    }
  };

  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath || `/${newLocale}`);
  };

  const navItems = [
    { icon: ShoppingCart, label: t('cart'), href: `/${locale}/cart`, badge: cartCount },
    { icon: Store, label: t('merchants'), href: `/${locale}/merchant` },
    { icon: Home, label: t('home'), href: `/${locale}` },
  ];

  const categories = [
    { id: 'fashion', ar: 'أزياء', en: 'Fashion' },
    { id: 'electronics', ar: 'إلكترونيات', en: 'Electronics' },
    { id: 'home', ar: 'المنزل', en: 'Home' },
    { id: 'beauty', ar: 'جمال وعناية', en: 'Beauty & Care' },
    { id: 'toys', ar: 'ألعاب', en: 'Toys & Games' },
    { id: 'sports', ar: 'رياضة', en: 'Sports' },
    { id: 'supermarket', ar: 'سوبرماركت', en: 'Supermarket' },
    { id: 'books', ar: 'كتب', en: 'Books' }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-primary shadow-sm">
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
          <Link href={`/${locale}`} className="shrink-0 flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-black/10 bg-white flex items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="Wafir Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl lg:text-3xl font-black tracking-tight text-black">
              {locale === 'ar' ? 'وافر' : 'Wafir'}
            </span>
          </Link>

          {/* Mobile Quick Actions */}
          <div className="flex lg:hidden items-center gap-2">
            <button 
              onClick={toggleLanguage} 
              className="p-2 text-sm font-bold text-black/80 hover:text-black"
            >
              {locale === 'ar' ? 'EN' : 'AR'}
            </button>
            <Link href={`/${locale}/cart`} className="relative p-2 text-black/80 hover:text-black">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:flex-1 max-w-2xl order-3 lg:order-0">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder') || 'Search...'}
              className={`w-full h-12 bg-white rounded-md ${locale === 'ar' ? 'pr-4 pl-24' : 'pl-4 pr-24'} text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-all`}
            />
            <button type="submit" className={`absolute ${locale === 'ar' ? 'left-1' : 'right-1'} h-10 px-6 lg:px-8 bg-black text-white rounded-md font-bold text-sm hover:bg-black/90 transition-colors`}>
              {t('search_button') || 'Search'}
            </button>
          </div>
        </form>

        {/* Desktop Actions Icons */}
        <div className="hidden lg:flex items-center gap-6">
          {navItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className="flex flex-col items-center gap-1 group relative transition-colors"
            >
              <div className="relative p-2 rounded-xl group-hover:bg-black/5 transition-colors">
                <item.icon className="w-6 h-6 text-black/80 group-hover:text-black transition-colors" />
                  {!!item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">
                      {item.badge}
                    </span>
                  )}
              </div>
              <span className="text-[12px] font-bold text-black/80 group-hover:text-black whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Desktop Notifications Bell */}
          <div className="flex flex-col items-center gap-1">
            <NotificationDropdown />
            <span className="text-[12px] font-bold text-black/80 whitespace-nowrap">
              {locale === 'ar' ? 'الإشعارات' : 'Alerts'}
            </span>
          </div>
          
          {/* Desktop Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-2 rounded-xl group-hover:bg-black/5">
              <span className="text-xl font-bold text-black/80 group-hover:text-black">
                {locale === 'ar' ? 'EN' : 'AR'}
              </span>
            </div>
            <span className="text-[12px] font-bold text-black/80 group-hover:text-black">
              {t('language_label') || 'Language'}
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
                  {!!item.badge && (
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

      {/* Secondary Category Navigation Bar */}
      <div className="hidden lg:block w-full bg-white border-t border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-12 flex items-center gap-6 overflow-x-auto scrollbar-hide">
          <Link href={`/${locale}/categories`} className="font-bold text-sm text-gray-800 hover:text-primary whitespace-nowrap shrink-0">
            {locale === 'ar' ? 'كل الفئات' : 'All Categories'}
          </Link>
          <div className="w-[1px] h-4 bg-gray-200 shrink-0"></div>
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/${locale}/categories/${cat.id}`}
              className="text-sm font-semibold text-gray-600 hover:text-primary whitespace-nowrap shrink-0 transition-colors"
            >
              {locale === 'ar' ? cat.ar : cat.en}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Mobile Category Navigation Bar */}
      <div className="lg:hidden w-full bg-white border-t border-gray-100">
        <div className="px-4 py-2.5 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/${locale}/categories/${cat.id}`}
              className="text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 border border-gray-100 hover:border-primary hover:text-primary transition-all"
            >
              {locale === 'ar' ? cat.ar : cat.en}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
