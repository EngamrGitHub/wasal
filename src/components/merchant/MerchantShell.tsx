'use client';

import React, { useState, useEffect } from "react";
import { MerchantHeader } from "@/src/components/merchant/MerchantHeader";
import { MerchantSidebar } from "@/src/components/merchant/MerchantSidebar";

export function MerchantShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('merchant_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('merchant_sidebar_collapsed', String(newVal));
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <MerchantSidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <MerchantHeader isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
