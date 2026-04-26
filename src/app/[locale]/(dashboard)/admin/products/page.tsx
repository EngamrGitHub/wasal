'use client'

import { Column, DataTable } from '@/src/components/admin/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react'

const mockProducts = [
  { id: '1', name: 'Wireless Headphones', category: 'Electronics', price: '$99.99', stock: 45, status: 'Active' },
  { id: '2', name: 'Running Shoes', category: 'Sports', price: '$120.00', stock: 12, status: 'Low Stock' },
  { id: '3', name: 'Smart Watch', category: 'Electronics', price: '$199.50', stock: 0, status: 'Out of Stock' },
  { id: '4', name: 'Coffee Maker', category: 'Home', price: '$85.00', stock: 30, status: 'Active' },
];

export default function AdminProductsPage() {
  const columns: Column<typeof mockProducts[0]>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Price', accessorKey: 'price' },
    { header: 'Stock', accessorKey: 'stock' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (item) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          item.status === 'Active' ? 'bg-success/10 text-success' :
          item.status === 'Low Stock' ? 'bg-yellow-500/10 text-yellow-600' :
          'bg-error/10 text-error'
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
          <button className="p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 rounded-lg">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-error transition-colors bg-gray-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Products Management</h1>
          <p className="text-gray-500 mt-2">View, add, and manage your products catalog.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Add New Product
        </button>
      </div>

      <DataTable 
        data={mockProducts} 
        columns={columns} 
        keyExtractor={(item) => item.id} 
      />
    </div>
  )
}
