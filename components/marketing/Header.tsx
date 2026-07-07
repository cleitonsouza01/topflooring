import { business, navLinks } from '@/lib/business';
import { LogoMark } from './Logo';
import { PhoneIcon } from './icons';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bone/95 backdrop-blur border-b border-navy/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-3">
          <a
            href="#top"
            className="logo-link flex items-center gap-2.5 shrink-0 min-h-[44px]"
            aria-label="Top Flooring Orlando — home"
          >
            <LogoMark className="h-[30px] sm:h-[38px] w-auto shrink-0" />
            <span className="leading-none">
              <span className="block font-display font-bold text-navy text-[15px] sm:text-base tracking-tight">
                TOP FLOORING
              </span>
              <span className="block eyebrow text-clay text-[9px] sm:text-[10px] tracking-[0.28em]">
                ORLANDO, FL
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-navy/80" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="cta-underline hover:text-navy">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={business.phoneHref}
              className="hidden sm:flex items-center gap-2 text-navy font-semibold text-sm hover:text-clay"
            >
              <PhoneIcon className="w-4 h-4" />
              {business.phoneDisplay}
            </a>
            <a
              href="#estimate"
              className="shine bg-ochre hover:bg-ochred text-ink font-semibold text-sm px-3.5 sm:px-5 py-2.5 rounded-md shadow-sm min-h-[44px] flex items-center transition-colors"
            >
              Get Estimate
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
