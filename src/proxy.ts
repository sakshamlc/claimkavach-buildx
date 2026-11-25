import { NextResponse, type NextRequest } from 'next/server';

export function buildContentSecurityPolicy(isDev: boolean): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * Next.js 16 Proxy (replaces deprecated middleware.ts)
 * ====================================================
 * Attaches strict security headers across pages and API routes, and enforces
 * `Cache-Control: no-store` on `/api/**` responses.
 */
export function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV !== 'production';

  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(isDev));
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
