'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BaseService } from '@/src/services/baseService';
import { Product, OrderItem } from '@/src/types';
import { ShoppingBag, Package, Star, Clock } from 'lucide-react';
import { Loader } from '@/src/components/ui/Loader';
import { ConnectionStatus } from '@/src/components/ui/ConnectionStatus';
import { createClient } from '@/src/lib/supabase/client';

export default function MerchantDashboardPage() {
  const t = useTranslations('Merchant.Dashboard');
  const tCommon = useTranslations('Common');

  const [stats, setStats] = useState({
    totalSales: 0,
    activeProducts: 0,
    pendingOrders: 0,
    storeRating: 4.8 // Mock rating for now
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const supabase = createClient();
        if (!supabase) throw new Error('Supabase client not initialized');

        const { data: { user } } = await supabase.auth.getUser();
        const storeId = user?.user_metadata?.store_id;

        let activeProducts = 0;
        let pendingOrders = 0;
        let totalSales = 0;

        if (storeId) {
          // Count active approved products for this merchant
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('approval_status', 'APPROVED');
          activeProducts = count || 0;

          // Fetch order items belonging to this merchant
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('*, variant:product_variants!inner(product:products!inner(store_id))')
            .eq('variant.product.store_id', storeId);

          if (orderItems && orderItems.length > 0) {
            totalSales = orderItems.reduce((acc: number, item: any) => acc + (parseFloat(item.unit_price || item.price_at_time) * item.quantity), 0);
            pendingOrders = orderItems.length;
          }
        }

        if (isMounted) {
          setStats(prev => ({
            ...prev,
            activeProducts,
            totalSales,
            pendingOrders
          }));
        }
      } catch (error) {
        console.error("Error fetching merchant stats:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => { isMounted = false; };
  }, []);

  const statCards = [
    {
      title: t('stats.total_sales') || 'Total Sales',
      value: `${stats.totalSales.toFixed(2)} EGP`,
      icon: <ShoppingBag className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: t('stats.active_products') || 'Active Products',
      value: stats.activeProducts,
      icon: <Package className="w-8 h-8 text-green-500" />,
      bg: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: t('stats.pending_orders') || 'Pending Orders',
      value: stats.pendingOrders,
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      bg: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: t('stats.store_rating') || 'Store Rating',
      value: stats.storeRating,
      icon: <Star className="w-8 h-8 text-yellow-500 fill-current" />,
      bg: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    }
  ];

  if (loading) {
    return <Loader size="lg" text={tCommon('loading') || "Loading Dashboard..."} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">{t('title') || 'Dashboard'}</h1>
        <p className="text-gray-500 mt-2">{t('description') || "Welcome back! Here is what's happening with your store today."}</p>
      </div>

      <ConnectionStatus />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
            <div className={`p-4 rounded-xl ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{card.title}</p>
              <h3 className={`text-3xl font-black mt-1 ${card.textColor}`}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">{t('recent_sales') || 'Recent Sales'}</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Sales Chart</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">{t('recent_activity') || 'Recent Activity'}</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Activity Feed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
