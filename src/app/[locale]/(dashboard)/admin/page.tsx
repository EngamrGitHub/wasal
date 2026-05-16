'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UserService, OrderService, StoreService } from '@/src/services/baseService';
import { ProductService } from '@/src/services/productService';
import { Users, ShoppingCart, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { Loader } from '@/src/components/ui/Loader';
import { ConnectionStatus } from '@/src/components/ui/ConnectionStatus';

export default function AdminDashboardPage() {
  const t = useTranslations('Admin.Dashboard');
  const tCommon = useTranslations('Common');

  const [stats, setStats] = useState({
    usersCount: 0,
    ordersCount: 0,
    storesCount: 0,
    pendingProductsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch all counts in parallel for optimal performance
        const [users, orders, stores, pendingProducts] = await Promise.all([
          UserService.count().catch(() => 0),
          OrderService.count().catch(() => 0),
          StoreService.count('status', 'ACTIVE').catch(() => 0),
          ProductService.getPendingProducts().then(res => res.length).catch(() => 0) // or add count method to ProductService
        ]);

        if (isMounted) {
          setStats({
            usersCount: users,
            ordersCount: orders,
            storesCount: stores,
            pendingProductsCount: pendingProducts
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => { isMounted = false; };
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.usersCount,
      icon: <Users className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Orders',
      value: stats.ordersCount,
      icon: <ShoppingCart className="w-8 h-8 text-green-500" />,
      bg: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Active Stores',
      value: stats.storesCount,
      icon: <StoreIcon className="w-8 h-8 text-purple-500" />,
      bg: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Pending Products',
      value: stats.pendingProductsCount,
      icon: <AlertCircle className="w-8 h-8 text-yellow-500" />,
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
        <h1 className="text-3xl font-black text-foreground">{t('title') || 'Dashboard Overview'}</h1>
        <p className="text-gray-500 mt-2">{t('description') || "Welcome to the admin dashboard. Here's a summary of the system."}</p>
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

      {/* Placeholder for Recent Orders Table or Charts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4">System Health & Analytics</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">Chart Integration (e.g. Recharts) will go here</p>
        </div>
      </div>
    </div>
  );
}
