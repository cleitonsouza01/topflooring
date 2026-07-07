import { business } from '@/lib/business';
import { LogoMark } from './Logo';

const exploreLinks = [
  { href: '#services', label: 'Services' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#how', label: 'How it works' },
  { href: '#estimate', label: 'Free estimate' },
];

export function Footer() {
  return (
    <footer className="bg-ink text-bone">
      {/* Extra bottom padding on mobile so the fixed Call/Estimate bar never covers footer content. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoMark fill="#F0EBE0" className="h-[30px] sm:h-[38px] w-auto shrink-0" />
              <span className="font-display font-bold text-base tracking-tight">
                TOP FLOORING ORLANDO
              </span>
            </div>
            <p className="text-bone/65 text-sm leading-relaxed">{business.tagline}</p>
          </div>

          <div>
            <h3 className="eyebrow text-ochre mb-4">Contact</h3>
            <ul className="space-y-2.5 text-sm text-bone/80">
              <li>
                <a href={business.phoneHref} className="hover:text-ochre cta-underline">
                  {business.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={business.emailHref} className="hover:text-ochre cta-underline break-all">
                  {business.email}
                </a>
              </li>
              <li className="not-italic">
                {business.address.street}
                <br />
                {business.address.city}, {business.address.region} {business.address.postalCode}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-ochre mb-4">Hours</h3>
            <ul className="space-y-2.5 text-sm text-bone/80">
              <li>{business.hoursDisplay}</li>
              <li className="text-ochre font-semibold">Emergency service 24/7</li>
              <li className="text-bone/60">Residential &amp; commercial</li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-ochre mb-4">Explore</h3>
            <ul className="space-y-2.5 text-sm text-bone/80">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-ochre cta-underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#estimate"
              className="shine mt-5 inline-flex bg-ochre hover:bg-ochred text-ink font-semibold text-sm px-5 py-3 rounded-md min-h-[44px] items-center transition-colors"
            >
              Get My Free Estimate
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-bone/15 flex flex-col sm:flex-row gap-2 justify-between text-xs text-bone/50">
          <p>&copy; 2026 Top Flooring Orlando. All rights reserved.</p>
          <p>Locally owned in Orlando, FL · Licensed &amp; insured</p>
        </div>
      </div>
    </footer>
  );
}
