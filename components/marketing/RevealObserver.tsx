'use client';

import { useEffect } from 'react';

/**
 * One shared, one-shot IntersectionObserver that adds `.in` to every [data-reveal]
 * element as it scrolls into view. Mirrors the mockup: only runs when the root has
 * `.anim-ready` (JS active + motion allowed); otherwise content is already visible.
 * Renders nothing.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('anim-ready')) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (targets.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return null;
}
