'use client'

import { StatsCard } from '@/src/components/admin/StatsCard'
import { Package, ShoppingBag, DollarSign, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function MerchantDashboard() {
  const t = useTranslations('Merchant.Dashboard');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title')}</h1>
          <p className="text-gray-500 mt-2">{t('description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('stats.total_sales')}
          value="$12,450"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title={t('stats.active_products')}
          value="45"
          icon={Package}
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title={t('stats.pending_orders')}
          value="12"
          icon={ShoppingBag}
        />
        <StatsCard
          title={t('stats.store_rating')}
          value="4.8"
          icon={Star}
          trend={{ value: 0.1, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">{t('recent_sales')}</h3>
          <div className="flex items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            [Chart Placeholder]
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">{t('recent_activity')}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <p className="text-sm text-gray-600">Product "Premium Sneakers" approved.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <p className="text-sm text-gray-600">New order #1245 received.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-warning"></div>
              <p className="text-sm text-gray-600">Product "Wireless Headphones" pending approval.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
