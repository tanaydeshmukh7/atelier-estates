import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DemoStatusBanner from '@/components/common/DemoStatusBanner';
import RecoveryRedirect from '@/components/auth/RecoveryRedirect';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atelier Estates | Northup Studio — Exceptional Homes. Considered Living.',
  description:
    'A curated editorial agency for architecturally significant residences, villas, and private estates. Representing spaces where craft, light, and landscape converge.',
  keywords: [
    'luxury real estate',
    'architectural homes',
    'modern villas',
    'Northup Studio',
    'Atelier Estates',
    'contemporary architecture',
    'private acquisitions',
  ],
  authors: [{ name: 'Northup Studio' }],
  openGraph: {
    title: 'Atelier Estates — Exceptional Homes. Considered Living.',
    description:
      'Curated architectural residences and bespoke private acquisitions worldwide.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Atelier Estates',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <body className="font-sans bg-limestone-100 text-charcoal-800 antialiased selection:bg-terracotta selection:text-white">
        <RecoveryRedirect />
        <DemoStatusBanner />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
