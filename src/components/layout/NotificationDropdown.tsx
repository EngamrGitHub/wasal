'use client';

import React, { useState } from 'react';
import { Bell, ShoppingBag, CheckCircle, Wallet, Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';

export function NotificationDropdown() {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      title_ar: 'طلب جديد بقيمة 400.00 EGP بانتظار التأكيد!',
      title_en: 'New order of 400.00 EGP is pending confirmation!',
      time_ar: 'منذ دقيقتين',
      time_en: '2 mins ago',
      icon: ShoppingBag,
      iconColor: 'text-primary bg-primary/10',
    },
    {
      id: 2,
      type: 'product',
      title_ar: 'تم قبول منتجك قميص أزرق كلاسيكي فاخر من قبل الأدمن!',
      title_en: 'Your product "Premium Classic Blue Shirt" was approved by Admin!',
      time_ar: 'منذ ساعة',
      time_en: '1 hour ago',
      icon: CheckCircle,
      iconColor: 'text-success bg-success/10',
    },
    {
      id: 3,
      type: 'wallet',
      title_ar: 'تم تحويل عمولتك بقيمة 150.00 EGP إلى محفظتك بنجاح!',
      title_en: 'Your commission of 150.00 EGP has been paid successfully!',
      time_ar: 'منذ 5 ساعات',
      time_en: '5 hours ago',
      icon: Wallet,
      iconColor: 'text-warning bg-warning/10',
    }
  ]);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-primary/5 outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay to close */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div 
            className={`absolute ${locale === 'ar' ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="font-bold text-gray-900">
                {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
              </span>
              <div className="flex gap-2 text-xs">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="text-primary hover:underline font-bold"
                  >
                    {locale === 'ar' ? 'تحديد كمقروء' : 'Mark all read'}
                  </button>
                )}
                <button 
                  onClick={handleClearAll} 
                  className="text-gray-400 hover:text-error font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div key={notif.id} className="p-4 hover:bg-gray-50/30 transition-colors flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1 text-start">
                        <p className="text-sm font-semibold text-gray-800 leading-snug">
                          {locale === 'ar' ? notif.title_ar : notif.title_en}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          {locale === 'ar' ? notif.time_ar : notif.time_en}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Bell className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
                  <p className="text-sm font-medium">
                    {locale === 'ar' ? 'لا توجد إشعارات جديدة حالياً' : 'No new notifications'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
