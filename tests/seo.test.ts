import { describe, it, expect } from 'vitest';
import { buildMetadata, localBusinessJsonLd } from '@/lib/seo';
import { seoDefaults } from '@/lib/business';

describe('buildMetadata', () => {
  it('sets the default title, canonical, and OG image', () => {
    const meta = buildMetadata();
    expect(meta.title).toBe(seoDefaults.title);
    expect(meta.alternates?.canonical).toBe('/');
    expect(meta.openGraph?.images).toBeTruthy();
  });

  it('applies overrides on top of defaults', () => {
    const meta = buildMetadata({ title: 'Custom' });
    expect(meta.title).toBe('Custom');
    // untouched defaults remain
    expect(meta.description).toBe(seoDefaults.description);
  });
});

describe('localBusinessJsonLd', () => {
  const data = localBusinessJsonLd();

  it('is a HomeAndConstructionBusiness with NAP', () => {
    expect(data['@type']).toBe('HomeAndConstructionBusiness');
    expect(data.telephone).toBe('+16892557378');
    expect((data.address as Record<string, string>).postalCode).toBe('32835');
    expect((data.address as Record<string, string>).addressRegion).toBe('FL');
  });

  it('exposes opening hours 06:30–21:00', () => {
    const hours = data.openingHoursSpecification as Record<string, unknown>;
    expect(hours.opens).toBe('06:30');
    expect(hours.closes).toBe('21:00');
  });
});
