import { describe, it, expect, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/extract/route';
import { MAX_REQUEST_BYTES } from '@/lib/extract/schemas';

const VALID_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/==';

function makeValidPayload() {
  return {
    images: [
      {
        mimeType: 'image/jpeg',
        base64Data: VALID_BASE64,
        pageNumber: 1,
      },
    ],
    batchIndex: 0,
    totalBatches: 1,
  };
}

function makeJsonRequest(body: unknown, ip: string, extraHeaders?: Record<string, string>) {
  return new Request('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...extraHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/extract Route Handler', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 400 with Cache-Control: no-store on invalid JSON or schema mismatch', async () => {
    const res1 = await POST(makeJsonRequest('{broken-json', '10.0.0.1'));
    expect(res1.status).toBe(400);
    expect(res1.headers.get('cache-control')).toBe('no-store');

    const res2 = await POST(makeJsonRequest({ images: [] }, '10.0.0.2'));
    expect(res2.status).toBe(400);
    expect(res2.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 413 with Cache-Control: no-store when Content-Length or body exceeds 4 MB', async () => {
    const resHeader = await POST(
      makeJsonRequest(makeValidPayload(), '10.0.0.3', {
        'content-length': String(MAX_REQUEST_BYTES + 1),
      }),
    );
    expect(resHeader.status).toBe(413);
    expect(resHeader.headers.get('cache-control')).toBe('no-store');

    const oversizedPayload = JSON.stringify({
      images: [
        {
          mimeType: 'image/jpeg',
          base64Data: 'A'.repeat(MAX_REQUEST_BYTES + 64),
          pageNumber: 1,
        },
      ],
    });
    const resBody = await POST(makeJsonRequest(oversizedPayload, '10.0.0.4'));
    expect(resBody.status).toBe(413);
    expect(resBody.headers.get('cache-control')).toBe('no-store');
  });

  it('returns mock extraction when NODE_ENV !== "production" and EXTRACT_MOCK=true', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('EXTRACT_MOCK', 'true');

    const res = await POST(makeJsonRequest(makeValidPayload(), '10.0.0.5'));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');

    const data = await res.json();
    expect(data.mode).toBe('mock');
    expect(data.extraction.lineItems.length).toBeGreaterThan(0);
  });

  it('blocks mock mode when NODE_ENV === "production" and returns 503 if GEMINI_MODEL is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EXTRACT_MOCK', 'true');
    vi.stubEnv('GEMINI_MODEL', '');
    vi.stubEnv('GEMINI_API_KEY', 'dummy-key');

    const res = await POST(makeJsonRequest(makeValidPayload(), '10.0.0.6'));
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');

    const body = await res.json();
    expect(body.error).toBe('EXTRACTION_NOT_CONFIGURED');
  });

  it('returns clean 503 when GEMINI_MODEL is missing in non-mock mode (no hardcoded fallback)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('EXTRACT_MOCK', 'false');
    vi.stubEnv('GEMINI_MODEL', '');
    vi.stubEnv('GEMINI_API_KEY', 'dummy-key');

    const res = await POST(makeJsonRequest(makeValidPayload(), '10.0.0.7'));
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
