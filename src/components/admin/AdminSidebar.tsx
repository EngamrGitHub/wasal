'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, Tag,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'

interface AdminSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function AdminSidebar({ isCollapsed, toggleSidebar }: AdminSidebarProps) {
  const t = useTranslations('Admin.Sidebar');
  const locale = useLocale();
  const pathname = usePathname();
  
  const navItems = [
    { name: t('dashboard') || 'Dashboard', href: `/${locale}/admin`, icon: LayoutDashboard },
    { name: t('products') || 'Products', href: `/${locale}/admin/products`, icon: Package },
    { name: t('orders') || 'Orders', href: `/${locale}/admin/orders`, icon: ShoppingCart },
    { name: t('users') || 'Users', href: `/${locale}/admin/users`, icon: Users },
    { name: 'أكواد الخصم', href: `/${locale}/admin/coupons`, icon: Tag },
    { name: t('settings') || 'Settings', href: `/${locale}/admin/settings`, icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Hard reload to clear all session state
      window.location.replace(`/${locale}/login`);
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 min-h-screen hidden lg:flex flex-col justify-between sticky top-0 h-screen overflow-y-auto z-50 transition-all duration-300`}>
      <div className="p-4 flex flex-col">
        {/* Logo and title */}
        <Link href={`/${locale}`} className={`flex items-center gap-2 mb-8 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 bg-white shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.jpg" 
              alt="Wesal Logo" 
              className="absolute inset-x-0 top-0 w-full h-[165%] object-cover object-top"
            />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-black tracking-tight text-primary truncate transition-all duration-300">
              {locale === 'ar' ? 'وصال إداري' : 'Wesal Admin'}
            </span>
          )}
        </Link>

        {/* Navigation list */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${locale}/admin` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-semibold ${
                  isCollapsed ? 'justify-center' : 'text-start'
                } ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-gray-500 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-bold truncate transition-all duration-300">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Sidebar Collapse & Logout Toggle Button at the bottom */}
      <div className="p-4 border-t border-gray-50 space-y-2">
        {/* Red Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold w-full ${
            isCollapsed ? 'justify-center' : 'text-start'
          }`}
          title={locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="text-xs">{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          )}
        </button>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 hover:text-primary text-gray-400 rounded-xl transition-all font-bold"
          title={isCollapsed ? (locale === 'ar' ? 'توسيع القائمة' : 'Expand Sidebar') : (locale === 'ar' ? 'طي القائمة' : 'Collapse Sidebar')}
        >
          {isCollapsed ? (
            locale === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              {locale === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              <span className="text-xs">{locale === 'ar' ? 'طي القائمة' : 'Collapse'}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
