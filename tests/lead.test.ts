import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequest } from '@/functions/api/lead';

const env = {
  NOTIFYGW_API_KEY: 'ngw_test',
  LEAD_TO_EMAIL: 'owner@example.com',
  TURNSTILE_SECRET_KEY: 'ts_secret_test',
};

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const NOTIFYGW_URL = 'https://api.notifygw.com/api/v1/email';

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://site.test/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/**
 * Mock global fetch, routing by URL: siteverify returns a configurable Turnstile
 * result; the notifygw mailer always succeeds. Returns the spy for assertions.
 */
function mockFetch(opts: { siteverify?: { success: boolean } | Error } = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (url === SITEVERIFY_URL) {
      if (opts.siteverify instanceof Error) throw opts.siteverify;
      const success = opts.siteverify?.success ?? true;
      return new Response(JSON.stringify({ success }), { status: 200 });
    }
    // notifygw mailer
    return new Response(JSON.stringify({ outbox_id: 'x' }), { status: 202 });
  });
}

function siteverifyCalls(spy: ReturnType<typeof mockFetch>) {
  return spy.mock.calls.filter(([input]) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    return url === SITEVERIFY_URL;
  });
}

const validLead = {
  name: 'Jane Doe',
  phone: '(689) 555-0123',
  email: 'jane@example.com',
  service: 'Hardwood',
  details: 'Whole downstairs',
};

describe('lead Pages Function', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects non-POST methods with 405', async () => {
    const res = await onRequest({ request: new Request('https://site.test/api/lead'), env });
    expect(res.status).toBe(405);
  });

  it('rejects an invalid JSON body with 400', async () => {
    const res = await onRequest({ request: post('{not json'), env });
    expect(res.status).toBe(400);
  });

  it('returns 422 with field errors for missing fields', async () => {
    const res = await onRequest({ request: post({ name: '', phone: '12', email: 'bad', service: '' }), env });
    expect(res.status).toBe(422);
    const json = (await res.json()) as { errors: Record<string, string> };
    expect(Object.keys(json.errors)).toEqual(['name', 'phone', 'email', 'service']);
  });

  it('silently accepts and drops honeypot submissions without calling the mailer', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await onRequest({ request: post({ ...validLead, company: 'spam corp' }), env });
    expect(res.status).toBe(202);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('emails a valid lead via notifygw with a Bearer key and returns 200', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ outbox_id: 'x' }), { status: 202 }));

    const res = await onRequest({ request: post(validLead), env });
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce();

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.notifygw.com/api/v1/email');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer ngw_test');
    const sent = JSON.parse(init?.body as string);
    expect(sent.to).toBe('owner@example.com');
    expect(sent.subject).toContain('Jane Doe');
    expect(sent.message).toContain('jane@example.com');
  });

  it('fans out to every recipient in a comma-separated LEAD_TO_EMAIL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 202 }));

    const res = await onRequest({
      request: post(validLead),
      env: { NOTIFYGW_API_KEY: 'ngw_test', LEAD_TO_EMAIL: 'a@example.com, b@example.com ; c@example.com' },
    });

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    const sentTo = fetchSpy.mock.calls.map(([, init]) => JSON.parse(init?.body as string).to);
    expect(sentTo).toEqual(['a@example.com', 'b@example.com', 'c@example.com']);
  });

  it('still succeeds (200) when one of several recipients fails', async () => {
    let call = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      call += 1;
      return new Response('', { status: call === 1 ? 500 : 202 });
    });
    const res = await onRequest({
      request: post(validLead),
      env: { NOTIFYGW_API_KEY: 'ngw_test', LEAD_TO_EMAIL: 'bad@example.com, good@example.com' },
    });
    expect(res.status).toBe(200);
  });

  it('returns 502 when the mailer fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));
    const res = await onRequest({ request: post(validLead), env });
    expect(res.status).toBe(502);
  });

  it('returns 500 when mail service env is not configured', async () => {
    const res = await onRequest({ request: post(validLead), env: { NOTIFYGW_API_KEY: '', LEAD_TO_EMAIL: '' } });
    expect(res.status).toBe(500);
  });

  // ---- Time-trap ----

  it('time-trap: silently drops a submission completed faster than 800ms', async () => {
    const fetchSpy = mockFetch();
    const res = await onRequest({
      request: post({ ...validLead, formLoadedAt: Date.now() - 100 }),
      env,
    });
    expect(res.status).toBe(202);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('time-trap: allows a submission that took longer than 800ms', async () => {
    mockFetch();
    const res = await onRequest({
      request: post({ ...validLead, formLoadedAt: Date.now() - 5000 }),
      env,
    });
    expect(res.status).toBe(200);
  });

  it('time-trap: allows a request with no formLoadedAt (older client)', async () => {
    mockFetch();
    const res = await onRequest({ request: post(validLead), env });
    expect(res.status).toBe(200);
  });

  it('time-trap: allows a formLoadedAt in the future (clock skew, fail-open)', async () => {
    mockFetch();
    const res = await onRequest({
      request: post({ ...validLead, formLoadedAt: Date.now() + 60_000 }),
      env,
    });
    expect(res.status).toBe(200);
  });

  it('time-trap: ignores a malformed formLoadedAt (string / NaN / negative)', async () => {
    mockFetch();
    for (const bad of ['abc', Number.NaN, -1000] as unknown[]) {
      const res = await onRequest({ request: post({ ...validLead, formLoadedAt: bad }), env });
      expect(res.status).toBe(200);
    }
  });

  // ---- Turnstile ----

  it('turnstile: verifies a present token, passing the secret and remoteip', async () => {
    const fetchSpy = mockFetch({ siteverify: { success: true } });
    const res = await onRequest({
      request: post({ ...validLead, turnstileToken: 'tok_abc' }, { 'CF-Connecting-IP': '203.0.113.7' }),
      env,
    });
    expect(res.status).toBe(200);

    const calls = siteverifyCalls(fetchSpy);
    expect(calls).toHaveLength(1);
    const body = new URLSearchParams(calls[0][1]?.body as string);
    expect(body.get('secret')).toBe('ts_secret_test');
    expect(body.get('response')).toBe('tok_abc');
    expect(body.get('remoteip')).toBe('203.0.113.7');
  });

  it('turnstile: fails open (still delivers) when siteverify returns success:false', async () => {
    const fetchSpy = mockFetch({ siteverify: { success: false } });
    const res = await onRequest({ request: post({ ...validLead, turnstileToken: 'tok_bad' }), env });
    expect(res.status).toBe(200);
    expect(siteverifyCalls(fetchSpy)).toHaveLength(1); // verification ran
    // mailer still called despite failed verification
    const mailerCalled = fetchSpy.mock.calls.some(([input]) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      return url === NOTIFYGW_URL;
    });
    expect(mailerCalled).toBe(true);
  });

  it('turnstile: fails open when the siteverify call throws', async () => {
    const fetchSpy = mockFetch({ siteverify: new Error('network down') });
    const res = await onRequest({ request: post({ ...validLead, turnstileToken: 'tok_x' }), env });
    expect(res.status).toBe(200);
    expect(siteverifyCalls(fetchSpy)).toHaveLength(1);
  });

  it('turnstile: skips verification when the secret key is unset', async () => {
    const fetchSpy = mockFetch();
    const { TURNSTILE_SECRET_KEY, ...envNoSecret } = env;
    const res = await onRequest({ request: post({ ...validLead, turnstileToken: 'tok_x' }), env: envNoSecret });
    expect(res.status).toBe(200);
    expect(siteverifyCalls(fetchSpy)).toHaveLength(0);
  });

  it('turnstile: skips verification when no token is present', async () => {
    const fetchSpy = mockFetch();
    const res = await onRequest({ request: post(validLead), env });
    expect(res.status).toBe(200);
    expect(siteverifyCalls(fetchSpy)).toHaveLength(0);
  });
});
