import React from 'react'
import Link from 'next/link'
import { Globe } from 'lucide-react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header / Logo */}
            <div className="p-8">
                <Link href="/" className="inline-flex items-center space-x-2 space-x-reverse group">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
                        <Globe className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tighter text-primary">
                        TUJARIA
                    </span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="grow flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-premium animate-fade-in">
                    {children}
                </div>
            </div>

            {/* Simple Footer */}
            <div className="p-8 text-center text-sm text-muted">
                © 2026 TUJARIA. All rights reserved.
            </div>
        </div>
    )
}
