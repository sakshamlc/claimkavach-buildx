import { NextResponse, type NextRequest } from 'next/server';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Next.js 16 Proxy (replaces deprecated middleware.ts)
 * ====================================================
 * Attaches strict security headers across pages and API routes, and enforces
 * `Cache-Control: no-store` on `/api/**` responses.
 */
export function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');

  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
