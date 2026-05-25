'use client'

import { Search, Menu, Store } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import { NotificationDropdown } from '../layout/NotificationDropdown'
import { createClient } from '@/src/lib/supabase/client'

export function MerchantHeader() {
  const t = useTranslations('Merchant.Header');
  const locale = useLocale();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = locale === 'ar' 
            ? (user.user_metadata?.store_name_ar || user.user_metadata?.full_name || 'متجر وصال')
            : (user.user_metadata?.store_name_en || user.user_metadata?.full_name || 'Wesal Store');
          setStoreName(name);
          setStoreEmail(user.email || '');
        }
      } catch (err) {
        console.error('Error fetching merchant header info:', err);
      }
    };
    fetchMerchantData();
  }, [locale]);

  return (
    <header className="h-20 bg-white border-b border-gray-100 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 shadow-sm">
      <div className="flex items-center gap-4">
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
            placeholder={t('search_placeholder')}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) {
                url.searchParams.set('search', e.target.value);
              } else {
                url.searchParams.delete('search');
              }
              window.history.replaceState({}, '', url);
              window.dispatchEvent(new Event('popstate'));
            }}
            className={`h-10 w-64 bg-gray-50 border-transparent focus:bg-white focus:border-primary border-2 rounded-full text-sm outline-none transition-all ${locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <div className="flex items-center gap-3 border-l border-gray-100 pl-4 ml-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-bold text-foreground">{storeName || t('store_name')}</p>
            <p className="text-gray-500 text-xs">{storeEmail || t('store_email')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
