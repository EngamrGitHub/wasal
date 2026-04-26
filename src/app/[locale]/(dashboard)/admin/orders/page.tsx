'use client'

import { Column, DataTable } from '@/src/components/admin/DataTable';
import { Eye, Download } from 'lucide-react'

const mockOrders = [
  { id: '#ORD-001', customer: 'Ahmed Ali', date: '2023-10-25', items: 3, total: '$120.00', status: 'Delivered', payment: 'Paid' },
  { id: '#ORD-002', customer: 'Sara Connor', date: '2023-10-24', items: 1, total: '$45.00', status: 'Pending', payment: 'Unpaid' },
  { id: '#ORD-003', customer: 'John Doe', date: '2023-10-24', items: 5, total: '$340.50', status: 'Shipped', payment: 'Paid' },
  { id: '#ORD-004', customer: 'Fatima Zahra', date: '2023-10-23', items: 2, total: '$89.99', status: 'Processing', payment: 'Paid' },
];

export default function AdminOrdersPage() {
  const columns: Column<typeof mockOrders[0]>[] = [
    { header: 'Order ID', accessorKey: 'id' },
    { header: 'Customer', accessorKey: 'customer' },
    { header: 'Date', accessorKey: 'date' },
    { header: 'Items', accessorKey: 'items' },
    { header: 'Total', accessorKey: 'total' },
    { 
      header: 'Payment', 
      accessorKey: 'payment',
      cell: (item) => (
        <span className={`font-semibold ${item.payment === 'Paid' ? 'text-success' : 'text-error'}`}>
          {item.payment}
        </span>
      )
    },
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
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 rounded-lg" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 rounded-lg" title="Download Invoice">
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Orders Management</h1>
          <p className="text-gray-500 mt-2">Track and process all customer orders.</p>
        </div>
      </div>

      <DataTable 
        data={mockOrders} 
        columns={columns} 
        keyExtractor={(item) => item.id} 
      />
    </div>
  )
}
