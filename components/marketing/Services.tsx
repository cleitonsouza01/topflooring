import Image from 'next/image';
import { services } from '@/lib/business';

export function Services() {
  return (
    <section id="services" className="relative py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 lg:mb-14" data-reveal>
          <p className="eyebrow text-clay mb-3">01 · What we install</p>
          <h2 className="font-display font-bold text-navy text-3xl sm:text-4xl lg:text-[2.9rem] tracking-tight leading-tight">
            One team for every floor in your Orlando home
          </h2>
          <p className="mt-4 text-ink/70 text-base sm:text-lg">
            Hardwood to epoxy, backsplash to subfloor prep — no juggling separate contractors.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5" data-reveal>
          {services.map((service) => (
            <article
              key={service.title}
              className="svc-card group relative overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-navy/5"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.alt}
                  width={480}
                  height={360}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3.5 sm:p-4">
                <h3 className="font-display font-semibold text-navy text-[15px] sm:text-base leading-snug">
                  {service.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-ink/65 leading-relaxed">{service.benefit}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
