import type { MetadataRoute } from 'next';
import { business } from '@/lib/business';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: business.name,
    short_name: 'Top Flooring',
    description:
      "Orlando's full-service flooring experts — hardwood, tile, luxury vinyl, stone and epoxy.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F0EBE0',
    theme_color: '#1B3A5B',
    icons: [
      { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
