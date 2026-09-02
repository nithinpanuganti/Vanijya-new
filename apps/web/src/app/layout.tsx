import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Telugu } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { LanguageProvider } from '../lib/language-context';
import { ToastProvider } from '../components/ui/toast';
import { TopNav } from '../components/ui/top-nav';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-devanagari',
  display: 'swap',
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-telugu',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vanijya (वाणिज्य • వాణిజ్య) | National Agricultural Price & Market Linkages Portal',
  description: 'Real-time APMC Mandi Price Intelligence, Spatial Arbitrage, and Direct Farm-Gate Linkages',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoDevanagari.variable} ${notoTelugu.variable}`}>
      <body className="flex flex-col min-h-screen bg-amber-50/30 text-slate-900 font-sans antialiased selection:bg-amber-300 selection:text-amber-950">
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>
              <TopNav />
              <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
                {children}
              </main>
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
