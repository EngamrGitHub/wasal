import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/src/components/layout/Navbar";
import { routing } from '@/src/i18n/routing';
import QueryProvider from '@/src/components/providers/QueryProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://wafir.com'),
  title: "Wafir | وافر",
  description: "B2B & B2C E-commerce Marketplace",
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  alternates: {
    languages: {
      en:'/en',
      ar:'/ar',
    },
  },
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  
  // const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  console.log('DEBUG - Params received in Layout:', resolvedParams);

  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <QueryProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
