/**
 * Zero-Dependency Deployment Smoke Test
 * =====================================
 * Usage: node scripts/smoke.mjs <BASE_URL>
 * Example: node scripts/smoke.mjs http://127.0.0.1:3000
 *
 * Verifies security headers, /sources page, malformed POST -> 400 + no-store,
 * and oversized >4 MB POST -> 413 + no-store without sending real patient data.
 */

const baseUrlArg = process.argv[2];
if (!baseUrlArg) {
  console.error('Usage: node scripts/smoke.mjs <BASE_URL>');
  process.exit(1);
}

const baseUrl = baseUrlArg.replace(/\/+$/, '');
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  // 1. GET / -> 200 + security headers
  const homeRes = await fetch(`${baseUrl}/`);
  assert(homeRes.status === 200, `GET / expected 200, got ${homeRes.status}`);

  const csp = homeRes.headers.get('content-security-policy') || '';
  const nosniff = homeRes.headers.get('x-content-type-options') || '';
  const referrer = homeRes.headers.get('referrer-policy') || '';
  const xFrame = homeRes.headers.get('x-frame-options') || '';

  assert(csp.includes("worker-src 'self' blob:"), `Missing worker-src in CSP: ${csp}`);
  assert(nosniff.toLowerCase() === 'nosniff', `Expected X-Content-Type-Options: nosniff, got ${nosniff}`);
  assert(
    referrer.toLowerCase() === 'strict-origin-when-cross-origin',
    `Expected Referrer-Policy: strict-origin-when-cross-origin, got ${referrer}`,
  );
  assert(xFrame.toUpperCase() === 'DENY', `Expected X-Frame-Options: DENY, got ${xFrame}`);
  console.log('PASS 1/4: GET / -> 200 with strict security headers');

  // 2. GET /sources -> 200
  const sourcesRes = await fetch(`${baseUrl}/sources`);
  assert(sourcesRes.status === 200, `GET /sources expected 200, got ${sourcesRes.status}`);
  console.log('PASS 2/4: GET /sources -> 200');

  // 3. POST /api/extract malformed JSON -> 400 + Cache-Control: no-store
  const badRes = await fetch(`${baseUrl}/api/extract`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"images":[]}',
  });
  assert(badRes.status === 400, `POST malformed expected 400, got ${badRes.status}`);
  const badCache = badRes.headers.get('cache-control') || '';
  assert(badCache.includes('no-store'), `Expected Cache-Control: no-store on 400, got ${badCache}`);
  console.log('PASS 3/4: POST /api/extract invalid payload -> 400 + Cache-Control: no-store');

  // 4. POST /api/extract oversized (> 4 MB) -> 413 + Cache-Control: no-store
  const oversizedBody = JSON.stringify({
    images: [
      {
        mimeType: 'image/jpeg',
        base64Data: 'A'.repeat(MAX_REQUEST_BYTES + 128),
        pageNumber: 1,
      },
    ],
  });
  const bigRes = await fetch(`${baseUrl}/api/extract`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: oversizedBody,
  });
  assert(bigRes.status === 413, `POST oversized expected 413, got ${bigRes.status}`);
  const bigCache = bigRes.headers.get('cache-control') || '';
  assert(bigCache.includes('no-store'), `Expected Cache-Control: no-store on 413, got ${bigCache}`);
  console.log('PASS 4/4: POST /api/extract oversized payload -> 413 + Cache-Control: no-store');

  console.log('All smoke checks passed!');
}

run().catch((err) => {
  console.error('Smoke test failed:', err.message);
  process.exit(1);
});
