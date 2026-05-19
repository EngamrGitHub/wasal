'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Store } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'

export function MerchantSidebar() {
  const t = useTranslations('Merchant.Sidebar');
  const locale = useLocale();
  const pathname = usePathname();
  
  const navItems = [
    { name: t('dashboard'), href: `/${locale}/merchant`, icon: LayoutDashboard },
    { name: t('products'), href: `/${locale}/merchant/products`, icon: Package },
    { name: t('orders'), href: `/${locale}/merchant/orders`, icon: ShoppingBag },
    { name: t('settings'), href: `/${locale}/merchant/settings`, icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
        window.location.href = `/${locale}/login`;
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen hidden lg:block sticky top-0 h-screen overflow-y-auto z-50">
      <div className="p-6 flex flex-col h-full justify-between">
        <div>
          <Link href={`/${locale}/merchant`} className="mb-8 flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.jpg" 
                alt="Wesal Logo" 
                className="absolute inset-x-0 top-0 w-full h-[165%] object-cover object-top"
              />
            </div>
            <span className="text-lg font-black tracking-tight text-primary">
              {locale === 'ar' ? 'وصال التجار' : 'Wesal Merchant'}
            </span>
          </Link>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${locale}/merchant` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-gray-500 hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mt-auto text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold w-full text-right"
        >
          <LogOut className="w-5 h-5" />
          <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  )
}
