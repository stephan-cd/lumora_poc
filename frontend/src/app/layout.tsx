import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import AppProviders from '@/components/AppProviders';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lumora - Enterprise Skill & Learning Tracker',
  description: 'Enterprise skill repository, upskilling matrix, learning hours log, and manager approval dashboard for tracking organizational capabilities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`} style={{ height: '100%' }} suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, height: '100%', fontFamily: 'var(--font-poppins), sans-serif' }} suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
