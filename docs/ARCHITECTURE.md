# ClaimKavach Architecture

## 1. Unidirectional Pipeline

ClaimKavach enforces a strict one-way data flow:

`Upload / Compress (client-prep.ts)` -> `/api/extract (Gemini transcription)` -> `Mapper (mapper.ts + Zod)` -> `Pure Rules Engine (src/lib/audit/**)` -> `Report UI & Dispute Pack`

There are no reverse dependencies:
- `src/lib/audit/**` **cannot** import from `src/lib/extract/**`, `src/app/api/**`, `@google/generative-ai`, `ai`, or Node I/O modules.
- `eslint.config.mjs` enforces this boundary with `no-restricted-imports`, `no-restricted-globals` (`fetch`, `XMLHttpRequest`), and `no-restricted-syntax` (`Date.now()`, `new Date()`, `Math.random()`, `console.log`).
- `src/test/eslint-purity.test.ts` runs ESLint programmatically against a deliberately violating fixture (`src/test/fixtures/purity-violation.fixture.ts`) to prove the guardrail catches violations.

## 2. Integer-Paise Math & Strict Calendar Dates

- `src/lib/currency.ts` represents every monetary value as a safe integer in paise (`type Paise = number`). `rupeesToPaise` rounds floats safely at the boundary; `formatINR` formats Indian numbering (`₹1,25,000.00`) strictly at the UI layer.
- `src/lib/dates.ts` validates ISO `YYYY-MM-DD` dates using pure Gregorian leap-year/month-length arithmetic without calling `new Date()`, preventing timezone and locale drift.

## 3. Five-Tier Verdict Separation

`runAudit(bill, referenceDataset, referenceDateISO)` produces an `AuditReport` with 5 strictly separated buckets (`CONFIRMED`, `LIKELY`, `NEEDS_REVIEW`, `VALID_EXCLUSION`, `NOT_CHECKED`) and **no** merged `totalSavingsPaise` figure:

| Tier | Emitted When |
|------|--------------|
| `CONFIRMED` | Pure arithmetic mismatch (`qty * unitPrice !== lineTotal` or bill sum mismatch) OR ceiling overcharge backed by `verified: true` data within `[effectiveDate, validityEndDate]`. |
| `LIKELY` | Duplicate line item (same normalized description, `lineTotalPaise`, and date) OR ceiling overcharge backed by `verified: false` data (`unverifiedData: true`). |
| `NEEDS_REVIEW` | Unitemized pharmacy/consumables lump sum OR vague/unexplained TPA deduction (e.g., `"Reasonable & Customary"`). |
| `VALID_EXCLUSION` | TPA deduction matching a loaded standard non-payable rule within validity dates. |
| `NOT_CHECKED` | Missing category reference data, mismatched unit/specification, out-of-validity order, or missing IRDAI circular annexure. |

## 4. Reference Data & Provenance Pipeline

- Raw official PDFs live in `docs/sources/raw/`.
- `scripts/ingest-sources.mjs` computes SHA-256 hashes and regenerates static TypeScript in `src/lib/reference/dataset.ts` (zero runtime `fs` reads on Vercel).
- Every record defaults to `verified: false`; only an entry in `docs/sources/REVIEW.json` with a matching `fileName`, matching `sha256`, and `approved: true` flips a record to `verified: true`.

## 5. Security Boundaries

- `src/proxy.ts` (Next.js 16 proxy convention) attaches `Content-Security-Policy` (including `worker-src 'self' blob:` for `pdf.worker.min.mjs`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and `Cache-Control: no-store` on `/api/**`.
- `/api/extract` runs on `nodejs` runtime (`maxDuration = 60`), caps bodies at 4 MB (`413`), disables mock mode in `NODE_ENV === 'production'`, requires explicit `GEMINI_MODEL`, and logs zero request payloads or secrets.
