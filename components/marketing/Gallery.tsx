'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { galleryItems } from '@/lib/business';
import { ExpandIcon } from './icons';

export function Gallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);

  const isOpen = openIndex !== null;

  const open = useCallback((i: number) => {
    lastFocus.current = document.activeElement as HTMLElement;
    setOpenIndex(i);
  }, []);

  const close = useCallback(() => {
    setOpenIndex(null);
    lastFocus.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) => (i === null ? i : (i + delta + galleryItems.length) % galleryItems.length)),
    [],
  );

  // Lock body scroll + move focus to close button when opened.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard: Esc closes, arrows navigate, Tab cycles through the 3 controls (focus trap).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'Tab') {
        const focusables = [closeRef.current, prevRef.current, nextRef.current].filter(
          Boolean,
        ) as HTMLElement[];
        let idx = focusables.indexOf(document.activeElement as HTMLElement);
        if (idx === -1) idx = 0;
        e.preventDefault();
        const nextIdx = (idx + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length;
        focusables[nextIdx]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close, step]);

  const active = openIndex !== null ? galleryItems[openIndex] : null;

  return (
    <section id="gallery" className="relative bg-plaster py-16 sm:py-20 lg:py-24 overflow-hidden scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div className="max-w-2xl" data-reveal>
            <p className="eyebrow text-clay mb-3">04 · Our work</p>
            <h2 className="font-display font-bold text-navy text-3xl sm:text-4xl lg:text-[2.9rem] tracking-tight leading-tight">
              Real Orlando projects, tile by tile
            </h2>
            <p className="mt-4 text-ink/70 text-base">
              Hexagon marble, chevron backsplashes, statement stairs and custom patterns. Tap any
              project to enlarge.
            </p>
          </div>
          <a
            href="#estimate"
            className="shrink-0 text-navy font-semibold cta-underline hidden sm:inline-flex items-center gap-1"
          >
            See your project here →
          </a>
        </div>

        {/* Masonry via CSS columns; each tile opens the lightbox */}
        <div className="columns-2 lg:columns-3 gap-3 sm:gap-4 [column-fill:_balance]" data-reveal>
          {galleryItems.map((item, i) => (
            <button
              key={item.image}
              type="button"
              onClick={() => open(i)}
              className="gtile group relative block w-full mb-3 sm:mb-4 overflow-hidden rounded-lg break-inside-avoid"
            >
              <Image
                src={item.image}
                alt={item.alt}
                width={800}
                height={1000}
                loading="lazy"
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="w-full h-auto object-cover"
              />
              <span
                className="hexbadge absolute top-3 left-3 hexchip bg-ochre w-8 h-8 grid place-items-center rotate-45 opacity-0"
                aria-hidden="true"
              >
                <span className="hexchip bg-navy w-3.5 h-3.5" />
              </span>
              <span
                className="gtile-expand absolute top-3 right-3 bg-navy/80 text-bone w-8 h-8 rounded-full grid place-items-center"
                aria-hidden="true"
              >
                <ExpandIcon className="w-4 h-4" />
              </span>
              <span className="cap absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-navy/90 to-transparent text-bone text-left text-sm font-semibold">
                {item.caption}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {isOpen && active && (
        <div
          className="fixed inset-0 z-[90] bg-ink/92 backdrop-blur flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.caption} — image viewer`}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            ref={closeRef}
            type="button"
            aria-label="Close image viewer"
            onClick={close}
            className="absolute top-4 right-4 text-bone bg-navy/70 hover:bg-navy w-11 h-11 rounded-full grid place-items-center"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <button
            ref={prevRef}
            type="button"
            aria-label="Previous project"
            onClick={() => step(-1)}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-bone bg-navy/70 hover:bg-navy w-11 h-11 rounded-full grid place-items-center"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M15 18 9 12l6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            ref={nextRef}
            type="button"
            aria-label="Next project"
            onClick={() => step(1)}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-bone bg-navy/70 hover:bg-navy w-11 h-11 rounded-full grid place-items-center"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <figure className="max-w-5xl w-full text-center">
            <Image
              src={active.image}
              alt={active.alt}
              width={1600}
              height={1200}
              className="w-full max-h-[80vh] object-contain rounded-lg mx-auto"
            />
            <figcaption aria-live="polite" className="mt-4 text-bone/85 text-sm font-medium">
              {active.caption} · {openIndex! + 1} of {galleryItems.length}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
