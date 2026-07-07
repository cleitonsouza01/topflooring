'use client';

import { useEffect, useState } from 'react';
import { navLinks } from '@/lib/business';

/**
 * Desktop primary nav with scroll-spy: highlights the link for the section
 * currently in view so users always know where they are on the long page.
 * Sets aria-current="location" on the active link (see globals.css for the
 * matching visual underline). Degrades to a plain nav without JS.
 */
export function PrimaryNav() {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const ids = navLinks.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0 || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        // The section crossing the band just under the sticky header is "current".
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-navy/80" aria-label="Primary">
      {navLinks.map((link) => {
        const isActive = link.href.slice(1) === activeId;
        return (
          <a
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'location' : undefined}
            className="nav-link cta-underline hover:text-navy"
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
