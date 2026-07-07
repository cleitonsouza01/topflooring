import { business, processSteps } from '@/lib/business';

export function Process() {
  return (
    <section id="how" className="py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 lg:mb-14" data-reveal>
          <p className="eyebrow text-clay mb-3">03 · How it works</p>
          <h2 className="font-display font-bold text-navy text-3xl sm:text-4xl lg:text-[2.9rem] tracking-tight leading-tight">
            Four simple steps to floors you&apos;ll love
          </h2>
        </div>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6" data-reveal>
          {processSteps.map((step) => (
            <li key={step.num} className="step-card relative bg-plaster rounded-xl p-6 ring-1 ring-navy/5">
              <span
                className={`hexchip w-14 h-14 grid place-items-center mb-5 ${step.accent ? 'bg-ochre' : 'bg-navy'}`}
                aria-hidden="true"
              >
                <span
                  className={`font-display font-bold text-xl ${step.accent ? 'text-navy' : 'text-ochre'}`}
                >
                  {step.num}
                </span>
              </span>
              <h3 className="font-display font-semibold text-navy text-lg mb-2">{step.title}</h3>
              <p className="text-ink/70 text-sm leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <a
            href="#estimate"
            className="bg-navy hover:bg-navyd text-bone font-semibold px-6 py-3.5 rounded-md min-h-[48px] flex items-center transition-colors"
          >
            Book My Free In-Home Estimate
          </a>
          <p className="text-ink/75 text-sm">
            Or text a photo to{' '}
            <a href={business.phoneHref} className="text-clay font-semibold cta-underline">
              {business.phoneDisplay}
            </a>{' '}
            for a same-day ballpark.
          </p>
        </div>
      </div>
    </section>
  );
}
