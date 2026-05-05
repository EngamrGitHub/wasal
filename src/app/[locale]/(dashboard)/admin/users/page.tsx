'use client'

import { Column, DataTable } from '@/src/components/admin/DataTable';
import { MoreVertical } from 'lucide-react'
import { useTranslations } from 'next-intl';
import { User } from '@/src/types';
import { UserService } from '@/src/services/baseService';
import { useSupabaseData } from '@/src/hooks/useSupabaseData';

export default function AdminUsersPage() {
  const t = useTranslations('Admin.Users');
  const tCommon = useTranslations('Common');

  // جلب البيانات بشكل نظيف وبدون تكرار (DRY)
  const { data: users, loading, error } = useSupabaseData<User>(UserService);

  const columns: Column<User>[] = [
    { header: t('columns.name') || 'Name', accessorKey: 'name' },
    { header: t('columns.email') || 'Email', accessorKey: 'email' },
    { 
      header: t('columns.role') || 'Role', 
      accessorKey: 'role',
      cell: (item: User) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          item.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
          item.role === 'MERCHANT' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {tCommon(`status.${item.role}`) || item.role}
        </span>
      )
    },
    { 
      header: t('columns.joined') || 'Joined', 
      accessorKey: 'created_at',
      cell: (item: User) => new Date(item.created_at).toLocaleDateString()
    },
    {
      header: tCommon('actions') || 'Actions',
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
          <h1 className="text-3xl font-black text-foreground">{t('title') || 'Users'}</h1>
          <p className="text-gray-500 mt-2">{t('description') || 'Manage users.'}</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">{tCommon('loading') || 'Loading...'}</div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">Error: {error}</div>
      ) : (
        <DataTable 
          data={users} 
          columns={columns} 
          keyExtractor={(item) => item.id} 
        />
      )}
    </div>
  )
}
