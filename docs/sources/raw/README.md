# Reference Sources — Raw Documents

Place official government/regulatory PDF documents here for ingestion.

Files placed here will be processed by deterministic ingestion scripts that record:
- Page/row provenance
- Instrument number
- Date as printed
- Effective date
- Validity end
- GST treatment
- `verified: false` by default

Only a human editing `docs/sources/REVIEW.json` with a matching SHA-256 hash can flip a record to `verified: true`.
