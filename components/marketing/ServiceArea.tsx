import { serviceAreaCities } from '@/lib/business';

export function ServiceArea() {
  return (
    <section id="service-area" className="py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-8" data-reveal>
          <p className="eyebrow text-clay mb-3">06 · Where we work</p>
          <h2 className="font-display font-bold text-navy text-3xl sm:text-4xl lg:text-[2.9rem] tracking-tight leading-tight">
            Serving the greater Orlando metro
          </h2>
          <p className="mt-4 text-ink/70 text-base">And Central Florida for larger projects.</p>
        </div>
        <ul className="flex flex-wrap gap-2.5">
          {serviceAreaCities.map((city) => (
            <li
              key={city}
              className="bg-plaster ring-1 ring-navy/10 text-navy font-medium text-sm px-3.5 py-2 rounded-full"
            >
              {city}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
