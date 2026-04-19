'use client'

import Link from 'next/link'
import { ShoppingCart, Search, Home, Store, Settings2 } from 'lucide-react'
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

  const navItems = [
    { icon: ShoppingCart, label: t('cart'), href: `/${locale}/cart`, badge: 2 },
    { icon: Settings2, label: t('admin'), href: `/${locale}/admin` },
    { icon: Store, label: t('merchants'), href: `/${locale}/merchants` },
    { icon: Home, label: t('home'), href: `/${locale}` },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href={`/${locale}`} className="shrink-0">
          <span className="text-4xl font-black tracking-tight text-primary uppercase">
            TUJARIA
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              className={`w-full h-12 bg-white border-2 border-primary/20 rounded-full ${locale === 'ar' ? 'pr-6 pl-24' : 'pl-6 pr-24'} text-sm focus:outline-none focus:border-primary transition-all`}
            />
            <button className={`absolute ${locale === 'ar' ? 'left-1' : 'right-1'} h-10 px-8 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity`}>
              {locale === 'ar' ? 'بحث' : 'Search'}
            </button>
          </div>
        </div>

        {/* Actions Icons */}
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
          
          {/* Language Toggle */}
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
              {locale === 'ar' ? 'English' : 'العربية'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}
