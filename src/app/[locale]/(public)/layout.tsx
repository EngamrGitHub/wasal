import { Navbar } from '@/src/components/layout/Navbar'
import { Footer } from '@/src/components/layout/Footer'
import React from 'react'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main className="flex flex-col min-h-screen">
          <Navbar />
          <main className="grow min-h-screen">
            {children}
          </main>
          <Footer />
        </main>
    )
}