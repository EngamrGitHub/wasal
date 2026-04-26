'use client'

import { Column, DataTable } from '@/src/components/admin/DataTable';
import { StatsCard } from '@/src/components/admin/StatsCard';
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'

const mockRecentOrders = [
  { id: '#ORD-001', customer: 'Ahmed Ali', date: '2023-10-25', total: '$120.00', status: 'Delivered' },
  { id: '#ORD-002', customer: 'Sara Connor', date: '2023-10-24', total: '$45.00', status: 'Pending' },
  { id: '#ORD-003', customer: 'John Doe', date: '2023-10-24', total: '$340.50', status: 'Shipped' },
  { id: '#ORD-004', customer: 'Fatima Zahra', date: '2023-10-23', total: '$89.99', status: 'Delivered' },
];

export default function AdminDashboardPage() {
  const columns: Column<typeof mockRecentOrders[0]>[] = [
    { header: 'Order ID', accessorKey: 'id' },
    { header: 'Customer', accessorKey: 'customer' },
    { header: 'Date', accessorKey: 'date' },
    { header: 'Total', accessorKey: 'total' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (item) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          item.status === 'Delivered' ? 'bg-success/10 text-success' :
          item.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-600' :
          'bg-blue-500/10 text-blue-600'
        }`}>
          {item.status}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value="$24,560.00" 
          icon={DollarSign} 
          trend={{ value: 12.5, isPositive: true }} 
        />
        <StatsCard 
          title="Total Orders" 
          value="1,240" 
          icon={ShoppingBag} 
          trend={{ value: 5.2, isPositive: true }} 
        />
        <StatsCard 
          title="Active Users" 
          value="892" 
          icon={Users} 
          trend={{ value: 1.4, isPositive: false }} 
        />
        <StatsCard 
          title="Conversion Rate" 
          value="3.2%" 
          icon={Activity} 
          trend={{ value: 0.8, isPositive: true }} 
        />
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Recent Orders</h2>
          <button className="text-primary font-semibold hover:underline text-sm">View All Orders</button>
        </div>
        <DataTable 
          data={mockRecentOrders} 
          columns={columns} 
          keyExtractor={(item) => item.id} 
        />
      </div>
    </div>
  )
}
