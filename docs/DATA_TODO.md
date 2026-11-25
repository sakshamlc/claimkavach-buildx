# Data TODO

## Reference Data Sources Needed

This document tracks which official government/regulatory source documents are needed for the ClaimKavach rules engine.

### Priority Sources

| Source | Status | Notes |
|--------|--------|-------|
| NPPA Stent Price Orders | ❌ Not yet ingested | Ceiling prices for cardiac stents |
| NPPA Knee Implant Orders | ❌ Not yet ingested | Ceiling prices for knee implants |
| CGHS Rate Lists | ❌ Not yet ingested | Central govt health scheme rates |
| IRDAI Circulars | ❌ Not yet ingested | Insurance regulatory circulars |

### Ingestion Process

1. Place the official PDF in `docs/sources/raw/`
2. Write a deterministic ingestion script in `scripts/ingest/`
3. Script must record page/row provenance, instrument number, dates, GST treatment
4. All records start as `verified: false`
5. Human reviews and updates `docs/sources/REVIEW.json` with SHA-256 hash to flip to `verified: true`

### Current State

No reference data has been ingested yet. All price comparisons will return `NOT_CHECKED` with the reason: "No reference data loaded for this item category."
