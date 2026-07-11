'use client'

import { Search, Menu, AlignLeft, AlignRight, LogOut } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { NotificationDropdown } from '../layout/NotificationDropdown'
import { createClient } from '@/src/lib/supabase/client'

import { useRouter, usePathname } from '@/src/i18n/routing'
import { useSearchParams } from 'next/navigation'

interface AdminHeaderProps {
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
}

export function AdminHeader({ isCollapsed, toggleSidebar }: AdminHeaderProps) {
  const t = useTranslations('Admin.Header');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.replace(`/${locale}`);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Toggle Button for Desktop Sidebar Collapse */}
        <button 
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 bg-gray-50 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
          title={isCollapsed ? (locale === 'ar' ? 'توسيع القائمة' : 'Expand Sidebar') : (locale === 'ar' ? 'طي القائمة' : 'Collapse Sidebar')}
        >
          {isCollapsed ? (
            locale === 'ar' ? <AlignLeft className="w-5 h-5" /> : <AlignRight className="w-5 h-5" />
          ) : (
            locale === 'ar' ? <AlignRight className="w-5 h-5" /> : <AlignLeft className="w-5 h-5" />
          )}
        </button>

        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden p-2 text-gray-500 hover:text-primary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative hidden md:block">
          <Search className={`absolute ${locale === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
          <input
            type="text"
            value={searchValue}
            placeholder={t('search_placeholder') || 'Search...'}
            onChange={(e) => {
              const val = e.target.value;
              setSearchValue(val);
              const params = new URLSearchParams(searchParams.toString());
              if (val) {
                params.set('search', val);
              } else {
                params.delete('search');
              }
              router.replace(`${pathname}?${params.toString()}` as any);
            }}
            className={`h-10 w-64 bg-gray-50 border-transparent focus:bg-white focus:border-primary border-2 rounded-full text-sm outline-none transition-all ${locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />
        
        {/* Profile info and Logout block */}
        <div className="flex items-center gap-3 border-l border-gray-100 pl-4 ml-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            AD
          </div>
          <div className="hidden md:block text-sm text-start">
            <p className="font-bold text-foreground">Admin User</p>
            <p className="text-gray-500 text-xs">admin@wesal.com</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2.5 bg-red-50 hover:bg-red-100 hover:text-red-600 text-red-500 rounded-xl transition-all flex items-center justify-center border border-red-100"
          title={locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
