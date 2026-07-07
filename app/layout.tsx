import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { buildMetadata, localBusinessJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: '#1B3A5B',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Motion gate: add `.anim-ready` to <html> ONLY when JS runs AND motion is allowed.
 * No-JS and reduced-motion users never get it, so content stays visible & static.
 * Runs inline before paint to avoid a flash of hidden content.
 */
const motionGate = `(function(){try{var mm=window.matchMedia;if(!mm||!mm('(prefers-reduced-motion: reduce)').matches){document.documentElement.className+=' anim-ready';}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionGate }} />
        <JsonLd data={localBusinessJsonLd()} />
      </head>
      <body className="bg-bone text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
