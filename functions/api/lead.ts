/**
 * Cloudflare Pages Function — POST /api/lead
 *
 * Validates an estimate-request submission and emails it to the business owner via
 * notifygw.com (POST /api/v1/email). No database. Secrets come from Pages env vars:
 *   NOTIFYGW_API_KEY   (required, "ngw_...")
 *   NOTIFYGW_INSTANCE  (optional; only if more than one email instance is registered)
 *   LEAD_TO_EMAIL      (required; recipient inbox)
 */

interface Env {
  NOTIFYGW_API_KEY: string;
  NOTIFYGW_INSTANCE?: string;
  LEAD_TO_EMAIL: string;
  // Optional: absent means Turnstile verification is skipped entirely (fail-open).
  TURNSTILE_SECRET_KEY?: string;
}

interface LeadPayload {
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  details?: string;
  company?: string; // honeypot
  turnstileToken?: string; // Cloudflare Turnstile token (optional; fail-open)
  formLoadedAt?: number; // client mount time (ms since epoch) for the time-trap
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFYGW_URL = 'https://api.notifygw.com/api/v1/email';
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Minimum plausible human fill time. A submission recorded as faster than this is a
// script. Kept deliberately low: real submits (even with autofill) clear it, while
// scripted ones (tens of ms) don't — minimizing false positives on the one layer that
// can silently drop a real lead. See the design spec for the clock-skew reasoning.
const MIN_FILL_MS = 800;

// Verify a Turnstile token with Cloudflare. Advisory only: the result is logged but
// never gates delivery (fail-open). Bounded by an explicit timeout so a hung siteverify
// can't stall — and cost — a real lead.
async function verifyTurnstile(token: string, secret: string, remoteip: string | null): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const params = new URLSearchParams({ secret, response: token });
    if (remoteip) params.set('remoteip', remoteip);
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    const result = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!result.success) {
      console.warn('[lead] turnstile verification failed (fail-open)', result['error-codes'] ?? result);
    }
  } catch (err) {
    console.warn('[lead] turnstile verification error (fail-open)', err);
  } finally {
    clearTimeout(timer);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export const onRequest: (context: {
  request: Request;
  env: Env;
}) => Promise<Response> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  let data: LeadPayload;
  try {
    data = (await request.json()) as LeadPayload;
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  // Honeypot: silently accept-and-drop bots so they don't retry.
  if (clip(data.company, 200)) {
    console.warn('[lead] honeypot drop');
    return json({ ok: true }, 202);
  }

  // Time-trap: drop submissions completed implausibly fast for a human. Only fires on a
  // clean, small, positive elapsed time; anything else (missing, malformed, or a
  // future/negative value from client clock skew) falls through — fail-open. Same
  // response shape as the honeypot so a bot can't tell which check caught it.
  const loadedAt = data.formLoadedAt;
  if (typeof loadedAt === 'number' && Number.isFinite(loadedAt)) {
    const elapsed = Date.now() - loadedAt;
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
      console.warn(`[lead] time-trap drop: elapsed=${elapsed}ms`);
      return json({ ok: true }, 202);
    }
  }

  const name = clip(data.name, 120);
  const phone = clip(data.phone, 40);
  const email = clip(data.email, 160);
  const service = clip(data.service, 60);
  const details = clip(data.details, 2000);

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required.';
  if (phone.replace(/[^0-9]/g, '').length < 7) errors.phone = 'A valid phone is required.';
  if (!EMAIL_RE.test(email)) errors.email = 'A valid email is required.';
  if (!service) errors.service = 'A service selection is required.';
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, errors }, 422);
  }

  // Turnstile: advisory verification, only when both a token and a secret are present.
  // Never rejects the lead (fail-open) — it runs purely for its signal and logging.
  const turnstileToken = clip(data.turnstileToken, 2048);
  if (turnstileToken && env.TURNSTILE_SECRET_KEY) {
    await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'));
  }

  // LEAD_TO_EMAIL may list multiple recipients, comma- or semicolon-separated.
  // notifygw's `to` is a single address, so we send one email per recipient.
  const recipients = (env.LEAD_TO_EMAIL || '')
    .split(/[,;]/)
    .map((r) => r.trim())
    .filter(Boolean);

  if (!env.NOTIFYGW_API_KEY || recipients.length === 0) {
    return json({ ok: false, error: 'Mail service is not configured.' }, 500);
  }

  const message = [
    'New estimate request from the website',
    '',
    `Name:    ${name}`,
    `Phone:   ${phone}`,
    `Email:   ${email}`,
    `Service: ${service}`,
    `Details: ${details || '(none provided)'}`,
    '',
    `Submitted: ${new Date().toISOString()}`,
    '',
    'Reply directly to this lead at the email above.',
  ].join('\n');

  const subject = `New estimate request — ${name} (${service})`;

  async function sendTo(to: string): Promise<boolean> {
    const body: Record<string, string> = { to, subject, message };
    if (env.NOTIFYGW_INSTANCE) body.instance = env.NOTIFYGW_INSTANCE;
    try {
      const res = await fetch(NOTIFYGW_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.NOTIFYGW_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Do not leak provider internals to the client.
        console.error('notifygw error', to, res.status, await res.text().catch(() => ''));
        return false;
      }
      return true;
    } catch (err) {
      console.error('notifygw request failed', to, err);
      return false;
    }
  }

  const results = await Promise.all(recipients.map(sendTo));
  // Succeed if at least one recipient was notified — never drop a lead over a single bad address.
  if (!results.some(Boolean)) {
    return json({ ok: false, error: 'Could not send your request. Please try again.' }, 502);
  }

  return json({ ok: true }, 200);
};
