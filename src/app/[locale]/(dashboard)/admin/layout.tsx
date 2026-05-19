'use client';

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/src/components/admin/AdminHeader";
import { AdminSidebar } from "@/src/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('admin_sidebar_collapsed', String(newVal));
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
