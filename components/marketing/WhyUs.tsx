import { differentiators } from '@/lib/business';

export function WhyUs() {
  return (
    <section id="why" className="relative bg-navy text-bone overflow-hidden scroll-mt-20">
      <div className="hex-field-navy absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl mb-10 lg:mb-14" data-reveal>
          <p className="eyebrow text-ochrelt mb-3">02 · Why Top Flooring</p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.9rem] tracking-tight leading-tight">
            Built for Orlando homes, done the right way
          </h2>
        </div>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-bone/15 rounded-xl overflow-hidden"
          data-reveal
        >
          {differentiators.map((item) => (
            <div key={item.num} className="why-cell bg-navy p-6 lg:p-7">
              <span
                className="hexchip bg-ochre w-11 h-11 grid place-items-center mb-4 shrink-0"
                aria-hidden="true"
              >
                <span className="font-display font-bold text-navy text-sm">{item.num}</span>
              </span>
              <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-bone/75 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
