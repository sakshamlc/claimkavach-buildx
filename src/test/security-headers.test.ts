import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

describe('Security Headers (src/proxy.ts)', () => {
  it('sets CSP, nosniff, Referrer-Policy, and X-Frame-Options on page routes', () => {
    const req = new NextRequest('http://localhost:3000/');
    const res = proxy(req);

    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('sets Cache-Control: no-store on /api/** routes', () => {
    const req = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
    });
    const res = proxy(req);

    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
