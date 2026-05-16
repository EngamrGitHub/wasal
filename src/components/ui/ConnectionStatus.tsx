'use client'

import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'missing_keys' | 'error'>('checking')

  useEffect(() => {
    const check = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        setStatus('missing_keys')
      } else {
        setStatus('connected') // Assuming keys mean connected for this simple check
      }
    }
    check()
  }, [])

  if (status === 'connected') return null

  return (
    <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-4 ${
      status === 'missing_keys' ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-red-50 border-red-100 text-red-800'
    }`}>
      <div className="p-2 bg-white rounded-xl shadow-sm">
        {status === 'missing_keys' ? <WifiOff className="w-5 h-5 text-orange-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>
      <div>
        <h4 className="font-bold text-sm">
          {status === 'missing_keys' ? 'Supabase Connection Required' : 'Connection Error'}
        </h4>
        <p className="text-xs opacity-80 mt-0.5">
          {status === 'missing_keys' 
            ? 'Please add your Supabase URL and API Key to .env.local to enable all features.' 
            : 'There was an error connecting to Supabase. Please check your credentials.'}
        </p>
      </div>
      <a 
        href="https://supabase.com/dashboard" 
        target="_blank" 
        className="ml-auto px-4 py-2 bg-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition"
      >
        Setup Guide
      </a>
    </div>
  )
}
