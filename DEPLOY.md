# Vercel Deployment Checklist (`DEPLOY.md`)

## 1. Pre-Deploy Verification

Run all 4 local checks before pushing:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 2. Vercel Project Settings

1. **Framework Preset**: Next.js
2. **Install Command**: `pnpm install`
3. **Build Command**: `pnpm build` (runs `next build --webpack`)
4. **Environment Variables** (Production & Preview):
   - `GEMINI_API_KEY` — Your Google Gemini API key
   - `GEMINI_MODEL` — Exact model identifier (e.g. `gemini-2.0-flash`)
   - Do **NOT** set `EXTRACT_MOCK=true` in production (and `src/app/api/extract/route.ts` explicitly ignores `EXTRACT_MOCK` whenever `NODE_ENV === 'production'`).
5. **No Build-Time Secrets**: Static pages (`/` and `/sources`) require zero API keys or runtime filesystem reads of `docs/` during `next build`.

## 3. Post-Deploy Smoke Test

Run the zero-dependency smoke script against your live Vercel URL (never sends real patient data):
```bash
pnpm smoke https://<your-vercel-domain>.vercel.app
```

Expected output:
- `PASS 1/4: GET / -> 200 with strict security headers`
- `PASS 2/4: GET /sources -> 200`
- `PASS 3/4: POST /api/extract invalid payload -> 400 + Cache-Control: no-store`
- `PASS 4/4: POST /api/extract oversized payload -> 413 + Cache-Control: no-store`
