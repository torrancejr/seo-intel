import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SEOIntel — AI-Powered Location-Specific Content at Scale',
  description: 'Generate hundreds of unique, SEO-optimized articles for every city you target. Real data enrichment, not just city name swaps.',
  openGraph: {
    title: 'SEOIntel — AI-Powered Location-Specific Content at Scale',
    description: 'Generate hundreds of unique, SEO-optimized articles for every city you target.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
