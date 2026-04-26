'use client'

import { Column, DataTable } from '@/src/components/admin/DataTable';
import { MoreVertical, ShieldAlert } from 'lucide-react'

import { useTranslations } from 'next-intl';

const mockUsers = [
  { id: 'USR-001', name: 'Ahmed Ali', email: 'ahmed@example.com', role: 'Customer', status: 'Active', joined: '2023-01-15' },
  { id: 'USR-002', name: 'Sara Connor', email: 'sara@example.com', role: 'Merchant', status: 'Active', joined: '2023-02-10' },
  { id: 'USR-003', name: 'John Doe', email: 'john@example.com', role: 'Customer', status: 'Suspended', joined: '2023-03-05' },
  { id: 'USR-004', name: 'Admin User', email: 'admin@tujaria.com', role: 'Admin', status: 'Active', joined: '2022-12-01' },
];

export default function AdminUsersPage() {
  const t = useTranslations('Admin.Users');
  const tCommon = useTranslations('Common');

  const columns: Column<typeof mockUsers[0]>[] = [
    { header: t('columns.name'), accessorKey: 'name' },
    { header: t('columns.email'), accessorKey: 'email' },
    { 
      header: t('columns.role'), 
      accessorKey: 'role',
      cell: (item) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          item.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
          item.role === 'Merchant' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {/* Note: In a real app with i18n, role values should be translated too, but for mock data we translate on render */}
          {tCommon(`status.${item.role}`)}
        </span>
      )
    },
    { header: t('columns.joined'), accessorKey: 'joined' },
    { 
      header: t('columns.status'), 
      accessorKey: 'status',
      cell: (item) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          item.status === 'Active' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        }`}>
          {tCommon(`status.${item.status}`)}
        </span>
      )
    },
    {
      header: tCommon('actions'),
      accessorKey: 'actions',
      cell: () => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 rounded-lg">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t('title')}</h1>
          <p className="text-gray-500 mt-2">{t('description')}</p>
        </div>
      </div>

      <DataTable 
        data={mockUsers} 
        columns={columns} 
        keyExtractor={(item) => item.id} 
      />
    </div>
  )
}
