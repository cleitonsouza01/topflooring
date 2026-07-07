import { trustBadges } from '@/lib/business';

export function TrustBar() {
  return (
    <section aria-label="Why homeowners trust us" className="bg-ink text-bone">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <ul className="flex gap-x-6 gap-y-2 flex-wrap items-center justify-center lg:justify-between text-[13px] sm:text-sm font-medium">
          {trustBadges.map((badge) => (
            <li key={badge} className="flex items-center gap-2">
              <span className="hexchip bg-ochre w-2.5 h-2.5 shrink-0" aria-hidden="true" />
              {badge}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
