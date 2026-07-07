import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequest } from '@/functions/api/lead';

const env = {
  NOTIFYGW_API_KEY: 'ngw_test',
  LEAD_TO_EMAIL: 'owner@example.com',
};

function post(body: unknown): Request {
  return new Request('https://site.test/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
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
});
