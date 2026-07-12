'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from '@/src/i18n/routing';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const cleanedEmail = email.trim();
    const cleanedPassword = password.trim();

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password: cleanedPassword
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('فشل تسجيل الدخول، يرجى المحاولة لاحقاً');

      // Check role in metadata
      const role = data.user.user_metadata?.role || 'CUSTOMER';

      if (role === 'MERCHANT') {
        router.push('/merchant');
      } else if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }

    } catch (err: any) {
      console.error(err);
      setError(
        locale === 'ar' 
          ? (err.message.includes('Invalid login credentials') ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : err.message)
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Brand Logo & Titles */}
      <div className="flex flex-col items-center text-center">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white mb-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo.jpg" 
            alt="Wesal Logo" 
            className="absolute top-0 w-full h-[165%] object-cover object-top animate-fade-in"
          />
        </div>
        <h1 className="text-3xl font-black text-primary mb-1">{t('login_title')}</h1>
        <p className="text-muted text-sm">{t('login_subtitle')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 text-red-700 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-primary px-1">{t('email')}</label>
          <div className="relative">
            <Mail className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted w-5 h-5`} />
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('email_placeholder')}
              className={`w-full bg-background border border-border rounded-2xl py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-primary">{t('password')}</label>
            <Link href="#" className="text-xs text-accent hover:underline">{t('forgot_password')}</Link>
          </div>
          <div className="relative">
            <Lock className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted w-5 h-5`} />
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('password_placeholder')}
              className={`w-full bg-background border border-border rounded-2xl py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all`}
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold hover:shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {locale === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...'}
            </>
          ) : (
            t('login_button')
          )}
        </button>
      </form>
    </div>
  );
}