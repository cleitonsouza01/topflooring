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

  it('uses the brand name with the legal entity name', () => {
    expect(data.name).toBe('Top Flooring Orlando');
    expect(data.legalName).toBe('Top Flooring Services LLC');
  });

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

  it('includes local signals: geo, sameAs profiles, and a city-list areaServed', () => {
    const geo = data.geo as { latitude: number; longitude: number };
    expect(geo.latitude).toBeCloseTo(28.567, 2);
    expect(Array.isArray(data.sameAs)).toBe(true);
    expect((data.sameAs as string[]).some((u) => u.includes('facebook.com'))).toBe(true);
    expect(Array.isArray(data.areaServed)).toBe(true);
    expect((data.areaServed as { name: string }[])[0].name).toBe('Orlando');
  });
});
