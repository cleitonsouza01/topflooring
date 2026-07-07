import { testimonials } from '@/lib/business';
import { StarIcon, QuoteIcon } from './icons';

/**
 * NOTE: testimonials are PLACEHOLDER samples (see lib/business.ts). The disclaimer below
 * must remain until replaced with verified Google reviews.
 */
export function Testimonials() {
  return (
    <section aria-label="What customers say" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 lg:mb-14" data-reveal>
          <p className="eyebrow text-clay mb-3">05 · In their words</p>
          <h2 className="font-display font-bold text-navy text-3xl sm:text-4xl lg:text-[2.9rem] tracking-tight leading-tight">
            Orlando homeowners &amp; property managers
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6" data-reveal>
          {testimonials.map((t) => (
            <figure key={t.attribution} className="relative bg-white rounded-xl p-6 ring-1 ring-navy/5 shadow-sm">
              <span className="hexchip bg-ochre w-9 h-9 grid place-items-center mb-4" aria-hidden="true">
                <QuoteIcon className="w-4 h-4 text-navy" />
              </span>
              <div className="flex gap-0.5 text-ochre mb-3" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="w-4 h-4" />
                ))}
              </div>
              <blockquote className="text-ink/80 text-[15px] leading-relaxed">{t.quote}</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-navy">{t.attribution}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-xs text-ink/70">
          Reviews shown are illustrative samples pending verified Google reviews.
        </p>
      </div>
    </section>
  );
}
