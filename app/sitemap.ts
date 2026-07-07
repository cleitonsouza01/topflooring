import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/business';

export const dynamic = 'force-static';

// Structured so future blog URLs can be appended when Phase 2 lands.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
