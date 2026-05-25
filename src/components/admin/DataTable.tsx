'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  itemsPerPage?: number;
  hidePagination?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  itemsPerPage = 10,
  hidePagination = false
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const locale = useLocale();

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 shadow-sm">
        {locale === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
      </div>
    )
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-start">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 whitespace-nowrap text-start">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-gray-50/50 transition-colors">
                {columns.map((col, index) => (
                  <td key={index} className="px-6 py-4">
                    {col.cell ? col.cell(item) : (item as any)[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white flex-wrap gap-4">
        <div className="text-sm text-gray-500">
          {locale === 'ar' ? 'عرض' : 'Showing'} {startIndex + 1} {locale === 'ar' ? 'إلى' : 'to'} {Math.min(startIndex + itemsPerPage, data.length)} {locale === 'ar' ? 'من' : 'of'} {data.length} {locale === 'ar' ? 'عنصر' : 'entries'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${currentPage === 1
                ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary'
              }`}
            title={locale === 'ar' ? 'الصفحة السابقة' : 'Previous Page'}
          >
            {locale === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className="text-sm font-medium text-gray-700 px-2">
            {locale === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${currentPage === totalPages
                ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary'
              }`}
            title={locale === 'ar' ? 'الصفحة التالية' : 'Next Page'}
          >
            {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
