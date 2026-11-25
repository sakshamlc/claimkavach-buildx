# Data TODO

## Reference Data Sources Needed

This document tracks which official government/regulatory source documents are needed for the ClaimKavach rules engine.

### Priority Sources

| Source | Status | Notes |
|--------|--------|-------|
| NPPA Stent Price Orders | ❌ Not yet ingested | Ceiling prices for cardiac stents (DES / BMS) |
| NPPA Knee Implant Orders | ❌ Not yet ingested | Ceiling prices for orthopaedic knee implants |
| CGHS Rate Lists | ❌ Not yet ingested | Central govt health scheme package/procedure rates |
| IRDAI Non-Payable Circulars | ❌ Not yet ingested | Standard non-payable consumables / exclusion annexures |

### Provenance & Verification Process

1. Place the official PDF in `docs/sources/raw/` (never commit fabricated data).
2. Add the deterministic parsed extraction JSON beside it (or extend `scripts/ingest-sources.mjs` for that document layout) recording:
   - `provenancePageRow` (exact page and row number)
   - `instrumentNumber` and `instrumentDate` (as printed)
   - `effectiveDate` and `validityEndDate`
   - `gstTreatment`
3. Run `node scripts/ingest-sources.mjs` to compute the SHA-256 hash and regenerate `src/lib/reference/dataset.ts` with `verified: false` by default.
4. After human verification against the raw PDF, add an entry to `docs/sources/REVIEW.json`:
   ```json
   {
     "fileName": "example-order.pdf",
     "sha256": "<exact-sha256-hex>",
     "approved": true,
     "reviewedBy": "Saksham Chaudhari",
     "reviewedDate": "2026-11-25"
   }
   ```
5. Re-run `node scripts/ingest-sources.mjs` so matching SHA-256 entries flip to `verified: true` in `src/lib/reference/dataset.ts`.

### Current State

`docs/sources/raw/` currently contains no PDF documents (`REVIEW.json` has `reviews: []`). Therefore, `DEFAULT_REFERENCE_DATASET` in `src/lib/reference/dataset.ts` is intentionally empty, and all price-order and standard non-payable checks emit `NOT_CHECKED` with neutral, data-derived reasons.
