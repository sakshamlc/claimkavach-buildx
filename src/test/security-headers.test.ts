import { afterEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

describe('Security Headers (src/proxy.ts)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('omits unsafe-eval in production while enforcing strict CSP and security headers', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new NextRequest('http://localhost:3000/');
    const res = proxy(req);

    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('allows unsafe-eval in development mode for Next.js/React dev tooling', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = new NextRequest('http://localhost:3000/');
    const res = proxy(req);

    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it('sets Cache-Control: no-store on /api/** routes', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
    });
    const res = proxy(req);

    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
