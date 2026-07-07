import { business } from '@/lib/business';
import { CheckIcon } from './icons';
import { EstimateForm } from './EstimateForm';

const points = [
  'We bring the showroom to your door across greater Orlando.',
  'Every cost itemized up front — flexible financing available.',
  'Residential & commercial · 24/7 emergency service.',
];

export function Estimate() {
  return (
    <section id="estimate" className="relative bg-navy text-bone overflow-hidden scroll-mt-20">
      <div className="hex-field-navy absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="lg:pt-4" data-reveal>
            <p className="eyebrow text-ochrelt mb-3">The offer</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[3rem] tracking-tight leading-[1.05]">
              Free In-Home Estimate <span className="text-ochre">+</span> Shop-at-Home Samples
            </h2>
            <p className="mt-5 text-bone/85 text-base sm:text-lg leading-relaxed">
              No pressure, no obligation. Prefer it quick? Text a photo of your room to{' '}
              <a href={business.phoneHref} className="text-ochre font-semibold cta-underline">
                {business.phoneDisplay}
              </a>{' '}
              and we&apos;ll get you a ballpark the same day.
            </p>

            <ul className="mt-8 space-y-3 text-bone/85">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="hexchip bg-ochre w-6 h-6 grid place-items-center mt-0.5 shrink-0" aria-hidden="true">
                    <CheckIcon className="w-3 h-3 text-navy" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <EstimateForm />
        </div>
      </div>
    </section>
  );
}
