import { Navbar } from '@/src/components/layout/Navbar'
import { Footer } from '@/src/components/layout/Footer'
import { WhatsAppWidget } from '@/src/components/ui/WhatsAppWidget'
import React from 'react'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen relative">
          <Navbar />
          <main className="grow">
            {children}
          </main>
          <Footer />
          {/* Global WhatsApp Chat Widget for Public Pages */}
          <WhatsAppWidget phoneNumber="201024380714" />
        </div>
    )
}