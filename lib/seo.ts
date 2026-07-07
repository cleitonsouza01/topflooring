import type { Metadata } from 'next';
import { business, siteUrl, seoDefaults } from './business';

/** Base metadata applied at the root layout; pages can override per-route. */
export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: seoDefaults.title,
    description: seoDefaults.description,
    applicationName: business.shortName,
    alternates: { canonical: '/' },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    appleWebApp: { title: 'TopFlooring' },
    openGraph: {
      type: 'website',
      siteName: business.shortName,
      title: seoDefaults.title,
      description: seoDefaults.description,
      url: siteUrl,
      locale: 'en_US',
      images: [
        {
          url: seoDefaults.ogImage,
          width: 1200,
          height: 630,
          alt: business.shortName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoDefaults.title,
      description: seoDefaults.description,
      images: [seoDefaults.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    ...overrides,
  };
}

/**
 * JSON-LD for the local business. Uses HomeAndConstructionBusiness (a LocalBusiness
 * subtype) so search engines get NAP, hours, service area, and price range.
 */
export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${siteUrl}/#business`,
    name: business.name,
    image: `${siteUrl}${seoDefaults.ogImage}`,
    url: siteUrl,
    telephone: '+16892557378',
    email: business.email,
    priceRange: business.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
    areaServed: business.areaServed,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '06:30',
      closes: '21:00',
    },
  };
}
