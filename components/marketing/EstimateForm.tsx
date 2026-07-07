'use client';

import { useEffect, useRef, useState } from 'react';
import { business, serviceOptions } from '@/lib/business';
import { CheckIcon } from './icons';

type FieldName = 'name' | 'phone' | 'email' | 'service';
type Errors = Partial<Record<FieldName, string>>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- Cloudflare Turnstile (bonus anti-spam signal; strictly fail-open) ----
// The site key is inlined at build time. When it's absent, Turnstile is skipped
// entirely and the form behaves exactly as before — no widget, no token.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Load the Turnstile script at most once across the whole page, even under React
// StrictMode's double-mount. Resolves when window.turnstile is usable; rejects if the
// script can't load (blocked / offline) so the caller can fail open.
let turnstileScriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile"]',
    );
    if (existing) {
      if (window.turnstile) resolve();
      else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('turnstile load error')));
      }
      return;
    }
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      turnstileScriptPromise = null; // allow a later retry
      reject(new Error('turnstile load error'));
    };
    document.head.appendChild(script);
  });
  return turnstileScriptPromise;
}

function validateField(name: FieldName, value: string): string {
  switch (name) {
    case 'name':
      return value.trim() ? '' : 'Please enter your name.';
    case 'phone':
      return value.replace(/[^0-9]/g, '').length >= 7 ? '' : 'Please enter a valid phone number.';
    case 'email':
      return emailRe.test(value.trim()) ? '' : 'Please enter a valid email address.';
    case 'service':
      return value ? '' : 'Please choose a service.';
  }
}

const inputClass =
  'w-full rounded-md border border-navy/20 bg-white px-3.5 py-3 text-[15px] min-h-[48px] focus:border-navy';
const errorInputClass = 'border-red-600 ring-1 ring-red-600';

export function EstimateForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const successRef = useRef<HTMLDivElement>(null);

  // Anti-spam plumbing. All of this is best-effort: if any of it is missing, the
  // submission still goes through (the server treats an absent token / timestamp as
  // "no signal"). Nothing here can block a real lead on the client.
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileToken = useRef<string>('');
  // Recorded once, on first render, and preserved across StrictMode's remount.
  const formLoadedAt = useRef<number>(Date.now());

  // Move keyboard focus to the confirmation once it renders — otherwise focus is
  // lost (the submit button it was on has been removed from the DOM).
  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  // Render the invisible Turnstile widget once. interaction-only keeps it hidden unless
  // Cloudflare decides a specific visitor needs a challenge. Guarded so StrictMode's
  // double-mount (and any re-render) never produces a second widget.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || turnstileWidgetId.current !== null) return;
        const el = turnstileContainerRef.current;
        if (!el || !window.turnstile) return;
        turnstileWidgetId.current = window.turnstile.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          callback: (token: string) => {
            turnstileToken.current = token;
          },
          'error-callback': () => {
            turnstileToken.current = '';
          },
          'expired-callback': () => {
            turnstileToken.current = '';
          },
        });
      })
      .catch(() => {
        // Script blocked or offline — fail open, no token is sent.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A submitted token is single-use; get a fresh one for any subsequent attempt.
  function resetTurnstile() {
    if (turnstileWidgetId.current !== null && window.turnstile) {
      try {
        window.turnstile.reset(turnstileWidgetId.current);
      } catch {
        // ignore — a reset failure just means the next submit sends no/stale token
      }
    }
    turnstileToken.current = '';
  }

  function setFieldError(name: FieldName, value: string) {
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
    return !msg;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: real users never fill this hidden field.
    if ((data.get('company') as string)?.trim()) {
      setStatus('success'); // silently accept-and-drop bots
      return;
    }

    const fields: FieldName[] = ['name', 'phone', 'email', 'service'];
    const nextErrors: Errors = {};
    let firstInvalid: FieldName | null = null;
    for (const f of fields) {
      const msg = validateField(f, (data.get(f) as string) ?? '');
      if (msg) {
        nextErrors[f] = msg;
        if (!firstInvalid) firstInvalid = f;
      }
    }
    setErrors(nextErrors);
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          phone: data.get('phone'),
          email: data.get('email'),
          service: data.get('service'),
          details: data.get('details'),
          formLoadedAt: formLoadedAt.current,
          // Omit the field entirely when we have no token — the server skips
          // verification in that case rather than treating it as a failure.
          ...(turnstileToken.current ? { turnstileToken: turnstileToken.current } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setStatus('success');
    } catch {
      // The token we just sent is spent; refresh it so a retry can be verified.
      resetTurnstile();
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-bone text-ink rounded-2xl p-6 sm:p-8 shadow-tile">
        <div ref={successRef} tabIndex={-1} role="status" aria-live="polite" className="text-center py-8 outline-none">
          <span className="hexchip bg-ochre w-16 h-16 grid place-items-center mx-auto mb-4" aria-hidden="true">
            <CheckIcon className="w-8 h-8 text-navy" />
          </span>
          <h3 className="font-display font-bold text-navy text-2xl">Thank you!</h3>
          <p className="mt-2 text-ink/70">
            Your request is in. We&apos;ll reach out within 24 hours. Need it faster? Call{' '}
            <a href={business.phoneHref} className="text-clay font-semibold cta-underline">
              {business.phoneDisplay}
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bone text-ink rounded-2xl p-6 sm:p-8 shadow-tile">
      <form onSubmit={handleSubmit} noValidate>
        <h3 className="font-display font-bold text-navy text-xl mb-1">Get your free estimate</h3>
        <p className="text-ink/75 text-sm mb-5">Takes under a minute.</p>

        <div className="grid gap-4">
          {/* Honeypot (visually hidden, not focusable) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-navy mb-1.5">
              Name <span className="text-clay">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby="name-error"
              onBlur={(e) => setFieldError('name', e.target.value)}
              className={`${inputClass} ${errors.name ? errorInputClass : ''}`}
              placeholder="Your name"
            />
            <p id="name-error" role="alert" className={`mt-1.5 text-sm font-medium text-red-700 ${errors.name ? '' : 'hidden'}`}>
              {errors.name}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-navy mb-1.5">
                Phone <span className="text-clay">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                aria-invalid={errors.phone ? 'true' : undefined}
                aria-describedby="phone-error"
                onBlur={(e) => setFieldError('phone', e.target.value)}
                className={`${inputClass} ${errors.phone ? errorInputClass : ''}`}
                placeholder="(689) 555-0123"
              />
              <p id="phone-error" role="alert" className={`mt-1.5 text-sm font-medium text-red-700 ${errors.phone ? '' : 'hidden'}`}>
                {errors.phone}
              </p>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-navy mb-1.5">
                Email <span className="text-clay">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby="email-error"
                onBlur={(e) => setFieldError('email', e.target.value)}
                className={`${inputClass} ${errors.email ? errorInputClass : ''}`}
                placeholder="you@email.com"
              />
              <p id="email-error" role="alert" className={`mt-1.5 text-sm font-medium text-red-700 ${errors.email ? '' : 'hidden'}`}>
                {errors.email}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="service" className="block text-sm font-semibold text-navy mb-1.5">
              Service needed <span className="text-clay">*</span>
            </label>
            <select
              id="service"
              name="service"
              required
              defaultValue=""
              aria-invalid={errors.service ? 'true' : undefined}
              aria-describedby="service-error"
              onChange={(e) => setFieldError('service', e.target.value)}
              className={`${inputClass} ${errors.service ? errorInputClass : ''}`}
            >
              <option value="" disabled>
                Select a service…
              </option>
              {serviceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <p id="service-error" role="alert" className={`mt-1.5 text-sm font-medium text-red-700 ${errors.service ? '' : 'hidden'}`}>
              {errors.service}
            </p>
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-semibold text-navy mb-1.5">
              Project details
            </label>
            <textarea
              id="details"
              name="details"
              rows={3}
              className="w-full rounded-md border border-navy/20 bg-white px-3.5 py-3 text-[15px] focus:border-navy"
              placeholder="Rooms, approx. square footage, timeline…"
            />
          </div>

          {/* Invisible Turnstile widget; only takes up space if a challenge appears. */}
          <div ref={turnstileContainerRef} className="empty:hidden" />

          <button
            type="submit"
            disabled={status === 'sending'}
            aria-busy={status === 'sending'}
            className="shine w-full bg-ochre hover:bg-ochred text-ink font-bold text-base px-6 py-4 rounded-md min-h-[52px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {status === 'sending' ? 'Sending…' : 'Get My Free Estimate'}
          </button>

          {status === 'error' && (
            <p role="alert" className="text-center text-sm font-medium text-red-700">
              Something went wrong. Please try again, or call{' '}
              <a href={business.phoneHref} className="font-semibold cta-underline">
                {business.phoneDisplay}
              </a>
              .
            </p>
          )}

          <p className="text-center text-xs text-ink/75">We reply within 24 hours. No spam, ever.</p>
        </div>
      </form>
    </div>
  );
}
