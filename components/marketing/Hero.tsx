import Image from 'next/image';
import { business } from '@/lib/business';
import { PhoneIcon, CheckIcon } from './icons';

export function Hero() {
  return (
    <section className="relative bg-navy text-bone overflow-hidden">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 items-stretch">
        {/* Copy panel */}
        <div className="relative px-5 sm:px-8 lg:px-10 pt-12 pb-14 lg:py-24 order-2 lg:order-1">
          <div className="hex-field absolute inset-0 opacity-[0.10] pointer-events-none" aria-hidden="true" />
          <div className="relative" data-reveal>
            <p className="eyebrow text-ochrelt mb-4">Orlando, FL · Locally owned</p>
            <h1 className="font-display font-bold leading-[1.02] tracking-tight text-[2.35rem] sm:text-5xl lg:text-[3.65rem]">
              Every floor type.
              <br />
              Every space.
              <br />
              <span className="text-ochre">One Orlando team.</span>
            </h1>
            <p className="mt-6 text-bone/85 text-base sm:text-lg max-w-xl leading-relaxed">
              Free in-home estimates with shop-at-home samples. Premium craftsmanship, honest
              pricing, no surprises — with flexible financing to fit your budget.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a
                href="#estimate"
                className="shine bg-ochre hover:bg-ochred text-ink font-bold text-base px-6 py-4 rounded-md text-center shadow-tile min-h-[52px] flex items-center justify-center transition-colors"
              >
                Get My Free Estimate
              </a>
              <a
                href={business.phoneHref}
                className="border border-bone/40 hover:border-ochre hover:text-ochrelt text-bone font-semibold text-base px-6 py-4 rounded-md text-center min-h-[52px] flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                Call {business.phoneDisplay}
              </a>
            </div>

            <p className="mt-6 text-sm text-bone/70 flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-ochre shrink-0" />
              No-obligation · We reply within 24 hours · Hardwood · Tile · Vinyl · Stone · Epoxy
            </p>
          </div>
        </div>

        {/* Photo panel with hex seam chip */}
        <div className="relative order-1 lg:order-2 min-h-[280px] sm:min-h-[380px] lg:min-h-full">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/images/feature-star-marble.webp"
              alt="White and walnut marble star and hexagon feature wall with recessed niche"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="hero-img object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-navy/70 lg:from-navy via-transparent to-transparent" />
          </div>
          {/* ochre hex chip straddling seam (hidden on small to avoid clutter) */}
          <span
            className="hero-chip hidden lg:grid absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 hexchip bg-ochre w-20 h-20 place-items-center shadow-tile"
            aria-hidden="true"
          >
            <span className="hero-chip-inner hexchip bg-navy w-10 h-10" />
          </span>
        </div>
      </div>
    </section>
  );
}
