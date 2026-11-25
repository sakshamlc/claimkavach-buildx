# Extraction Pipeline Test Guide (`/api/extract`)

## 1. Automated Tests (Vitest)

`src/test/extract-api.test.ts` and `src/test/extract-mapper.test.ts` verify:
- Malformed JSON or empty `images` array -> `400` + `Cache-Control: no-store`
- `Content-Length` or body `> 4 MB` -> `413` + `Cache-Control: no-store`
- `EXTRACT_MOCK=true` when `NODE_ENV !== 'production'` -> `200` mock payload
- `EXTRACT_MOCK=true` when `NODE_ENV === 'production'` -> ignored; returns `503` if `GEMINI_MODEL` is unset
- Missing `GEMINI_MODEL` in non-mock mode -> `503` (never falls back to a hardcoded model)

Run:
```bash
pnpm test
```

## 2. Manual Local Test — Mock Mode

1. Copy `.env.example` to `.env.local` and uncomment `EXTRACT_MOCK=true`.
2. Start dev server: `pnpm dev`
3. Open `http://127.0.0.1:3000`, check the privacy consent box, and upload any sample JPG/PNG/PDF.
4. Confirm client-side progress renders and Step 2 opens with mocked line items.

## 3. Manual Local Test — Real Gemini Mode

1. Set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-2.0-flash` in `.env.local` and set `EXTRACT_MOCK=false` (or remove it).
2. Restart `pnpm dev`.
3. Upload a non-sensitive synthetic/sample bill image or multi-page PDF.
4. Verify extracted lines populate Step 2 with `isCheckedByUser: false` and Reconcile Bar updates live.

## 4. Production Smoke Test

After starting `pnpm start` (or deploying to Vercel):
```bash
pnpm smoke http://127.0.0.1:3000
```
Verifies `GET /` (`200` + security headers), `GET /sources` (`200`), invalid `POST /api/extract` (`400` + `no-store`), and >4 MB `POST /api/extract` (`413` + `no-store`).
