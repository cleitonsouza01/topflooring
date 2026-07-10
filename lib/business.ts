/**
 * Single source of truth for Top Flooring Orlando business facts and page content.
 * Components and SEO/JSON-LD builders read from here — do not duplicate these values.
 * Source: docs/Top_Flooring_Services_Marketing_Base.md and landingpage CONTENT.md.
 */

export const business = {
  name: 'Top Flooring Orlando',
  legalName: 'Top Flooring Services LLC',
  shortName: 'Top Flooring Orlando',
  tagline: "Orlando's trusted flooring experts — every floor type, every space, done right.",
  phoneDisplay: '(689) 255-7378',
  phoneHref: 'tel:+16892557378',
  email: 'roberto.topflooring@gmail.com',
  emailHref: 'mailto:roberto.topflooring@gmail.com',
  address: {
    street: '1055 S Hiwassee Rd, Apt 2016',
    city: 'Orlando',
    region: 'FL',
    postalCode: '32835',
    country: 'US',
  },
  hoursDisplay: 'Mon–Sun · 6:30 AM – 9:00 PM',
  openingHours: 'Mo-Su 06:30-21:00',
  areaServed: 'Greater Orlando, FL',
  priceRange: '$$',
  // Google Business Profile marker coordinates for Top Flooring Orlando.
  geo: { latitude: 28.5670655, longitude: -81.3897125 },
} as const;

/** Official profiles — used for schema `sameAs`/`hasMap` and (optionally) footer links. */
export const socialLinks = {
  facebook: 'https://www.facebook.com/TopFlooringOrlando',
  instagram: 'https://www.instagram.com/TopFlooringOrlando',
  youtube: 'https://www.youtube.com/@TopFlooringOrlando',
  googleBusiness: 'https://maps.app.goo.gl/MGcUaawF8wk16JdD6',
  googleMaps: 'https://maps.app.goo.gl/7hvU4zSDnYaWZGCn7',
} as const;

/** Origin used for canonical URLs, OG, sitemap, robots. Overridable at deploy time. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.topflooringorlando.com'
).replace(/\/$/, '');

export const seoDefaults = {
  title: 'Top Flooring Orlando | Flooring Installation in Orlando, FL',
  description:
    "Orlando's flooring experts — hardwood, tile, luxury vinyl, stone & epoxy. Free in-home estimates and shop-at-home samples. Call (689) 255-7378.",
  ogImage: '/og-logo.jpg',
  logo: '/web-app-manifest-512x512.png',
} as const;

export const navLinks = [
  { href: '#services', label: 'Services' },
  { href: '#why', label: 'Why Us' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#how', label: 'Process' },
  { href: '#service-area', label: 'Service Area' },
] as const;

export const trustBadges = [
  'Free in-home estimates',
  'Shop-at-home samples',
  'Every flooring type',
  'Flexible financing',
  '24/7 emergency service',
] as const;

export type Service = {
  title: string;
  benefit: string;
  image: string;
  alt: string;
};

export const services: Service[] = [
  {
    title: 'Hardwood & Engineered Wood',
    benefit: 'Timeless warmth and lasting value — engineered options built for Florida humidity.',
    image: '/images/svc-hardwood.webp',
    alt: 'Oak hardwood plank hallway installation',
  },
  {
    title: 'Luxury Vinyl (LVP/LVT)',
    benefit: 'Waterproof, kid- and pet-proof, and beautiful — ideal for kitchens, baths and rentals.',
    image: '/images/svc-vinyl.webp',
    alt: 'Waterproof luxury vinyl plank flooring in a bright room',
  },
  {
    title: 'Tile & Natural Stone',
    benefit: 'Ceramic, porcelain, marble and travertine for wet, high-traffic and statement spaces.',
    image: '/images/svc-tile.webp',
    alt: 'Marble star and hexagon tile feature wall with niche',
  },
  {
    title: 'Laminate Flooring',
    benefit: 'Modern looks on a smart budget — perfect for bedrooms, offices and investment properties.',
    image: '/images/g-wood-03.webp',
    alt: 'Laminate wood-look flooring in a modern bedroom',
  },
  {
    title: 'Backsplash & Custom Tile',
    benefit: 'Kitchen and bath backsplashes, custom showers, inlays and geometric patterns.',
    image: '/images/g-backsplash-01.webp',
    alt: 'Navy and white geometric tile shower and backsplash',
  },
  {
    title: 'Stairs, Treads & Trim',
    benefit: 'Stair treads, risers, baseboards and clean transitions that finish the job right.',
    image: '/images/g-stair-01.webp',
    alt: 'Finished hardwood stair treads, risers and trim',
  },
  {
    title: 'Epoxy & Garage Floors',
    benefit: 'Seamless, chemical-resistant coatings for garages, workshops and showrooms.',
    image: '/images/svc-demolition.webp',
    alt: 'Epoxy garage floor coating and surface preparation',
  },
  {
    title: 'Removal & Subfloor Prep',
    benefit: 'Tear-out, haul-away, leveling and moisture control — the right base for floors that last.',
    image: '/images/svc-demolition.webp',
    alt: 'Old floor tear-out, haul-away and subfloor leveling',
  },
];

export type Differentiator = { num: string; title: string; body: string };

export const differentiators: Differentiator[] = [
  {
    num: '01',
    title: 'One team for every floor',
    body: 'Hardwood, engineered wood, LVP/LVT, laminate, tile, stone, epoxy and sheet vinyl — no juggling separate contractors.',
  },
  {
    num: '02',
    title: 'Start to finish',
    body: 'Old-floor removal, subfloor prep and leveling, installation, trim, and ongoing maintenance — all handled in-house.',
  },
  {
    num: '03',
    title: 'The showroom comes to you',
    body: 'Free in-home estimates and shop-at-home samples — decide in your own space, in your own light.',
  },
  {
    num: '04',
    title: 'Built for Florida',
    body: 'Moisture testing and vapor barriers that stand up to Florida humidity and slab foundations, so your floors last.',
  },
  {
    num: '05',
    title: 'Flexible financing',
    body: 'Premium floors without the up-front strain — payment plans that fit your budget.',
  },
  {
    num: '06',
    title: 'Every market',
    body: 'Homes, rentals, offices, restaurants, hospitality, new construction and insurance restoration.',
  },
];

export type ProcessStep = { num: string; title: string; body: string; accent?: boolean };

export const processSteps: ProcessStep[] = [
  {
    num: '1',
    title: 'Request your free estimate',
    body: 'Call, or send a photo of your space for a quick quote.',
  },
  {
    num: '2',
    title: 'We come to you',
    body: 'On-site measure and shop-at-home samples in your own light.',
  },
  {
    num: '3',
    title: 'Clear, honest quote',
    body: 'Every cost itemized up front, with financing options if you want them.',
  },
  {
    num: '4',
    title: 'Done right',
    body: 'Professional install, clean finish, floors built to last.',
    accent: true,
  },
];

export type GalleryItem = { image: string; caption: string; alt: string };

export const galleryItems: GalleryItem[] = [
  { image: '/images/g-tile-01.webp', caption: 'Grey hexagon marble floor', alt: 'Grey hexagon marble tile floor installation' },
  { image: '/images/g-backsplash-01.webp', caption: 'Navy geometric shower tile', alt: 'Navy and white geometric tile shower wall' },
  { image: '/images/feature-chevron.webp', caption: 'Charcoal chevron backsplash', alt: 'Charcoal chevron glass tile backsplash close-up' },
  { image: '/images/g-wood-01.webp', caption: 'Warm oak plank flooring', alt: 'Warm oak plank hardwood flooring in a living space' },
  { image: '/images/feature-star-marble.webp', caption: 'Marble star & hex feature wall', alt: 'White and walnut marble star and hexagon feature wall with niche' },
  { image: '/images/g-stair-02.webp', caption: 'Custom stair treads & risers', alt: 'Custom finished stair treads and risers' },
  { image: '/images/g-tile-02.webp', caption: 'Statement tile floor', alt: 'Statement patterned tile floor installation' },
  { image: '/images/g-backsplash-02.webp', caption: 'Custom kitchen backsplash', alt: 'Custom kitchen tile backsplash' },
  { image: '/images/g-wood-04.webp', caption: 'Wide-plank wood-look floor', alt: 'Wide-plank wood-look flooring in a bright room' },
  { image: '/images/g-tile-03.webp', caption: 'Porcelain tile living area', alt: 'Porcelain tile flooring in a living area' },
];

export const serviceOptions = [
  'Hardwood',
  'Luxury Vinyl',
  'Tile & Stone',
  'Laminate',
  'Backsplash/Custom Tile',
  'Stairs & Trim',
  'Epoxy/Garage',
  'Removal & Prep',
  'Not sure yet',
] as const;

export const serviceAreaCities = [
  'Orlando', 'Kissimmee', 'Winter Park', 'Windermere', 'Dr. Phillips', 'Lake Nona',
  'Ocoee', 'Winter Garden', 'Altamonte Springs', 'Sanford', 'Apopka', 'Clermont', 'Davenport',
] as const;

/**
 * PLACEHOLDER testimonials — illustrative samples only.
 * MUST be replaced with verified Google reviews before treating as real customer quotes.
 * The visible disclaimer must remain until then.
 */
export type Testimonial = { quote: string; attribution: string };

export const testimonials: Testimonial[] = [
  {
    quote:
      'They handled our whole downstairs — tile in the kitchen, luxury vinyl everywhere else — and matched the transitions perfectly. Quote was exactly what we paid.',
    attribution: 'Homeowner, Winter Park',
  },
  {
    quote:
      'Turned a rental around in under a week. Durable floors, clean work, easy to schedule around tenants.',
    attribution: 'Property manager, Lake Nona',
  },
  {
    quote:
      'Brought the samples to our house so we could see them in our own light. No showroom trips, no pressure. Floors look incredible.',
    attribution: 'Homeowner, Dr. Phillips',
  },
];
