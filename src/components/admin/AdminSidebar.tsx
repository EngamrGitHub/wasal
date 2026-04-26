'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { LayoutDashboard, Package, ShoppingCart, Users, Settings } from 'lucide-react'

export function AdminSidebar() {
  const t = useTranslations('Admin.Sidebar');
  const locale = useLocale();
  const pathname = usePathname();
  
  const navItems = [
    { name: t('dashboard'), href: `/${locale}/admin`, icon: LayoutDashboard },
    { name: t('products'), href: `/${locale}/admin/products`, icon: Package },
    { name: t('orders'), href: `/${locale}/admin/orders`, icon: ShoppingCart },
    { name: t('users'), href: `/${locale}/admin/users`, icon: Users },
    { name: t('settings'), href: `/${locale}/admin/settings`, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen hidden lg:block sticky top-0 h-screen overflow-y-auto z-50">
      <div className="p-6">
        <Link href={`/${locale}`} className="block mb-8">
          <span className="text-2xl font-black tracking-tight text-primary uppercase">
            TUJARIA ADMIN
          </span>
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${locale}/admin` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold ${
                  isActive
                    ? 'bg-primary text-white'
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
    </aside>
  )
}
