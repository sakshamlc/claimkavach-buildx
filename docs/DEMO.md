# ClaimKavach — 5-Minute BuildX 2026 Demo Video Script (300 Seconds)

All numbers below come directly from the application's built-in `SYNTHETIC` demo scenarios (`src/lib/demo/synthetic-bills.ts`) and deterministic audit output.

---

### `0:00 – 0:40` | Team Introduction & Problem
- **Speaker (Saksham Chaudhari):** "Hi, I'm Saksham Chaudhari, building **ClaimKavach** for the BuildX 2026 Healthtech track."
- **Problem:** "Picture an Indian family standing at a hospital billing counter with a ₹2–5 lakh discharge bill. Half the pages are dense line items, one row says *Pharmacy & Consumables Lump Sum* for ₹18,500, another diagnostic test appears twice, and the insurer deduction sheet cuts ₹12,000 as *Reasonable & Customary* with no breakdown. Families on a phone don't need an AI chatbot that hallucinates legal claims—they need exact math and honest verification."

### `0:40 – 1:30` | Solution & Architecture
- **Show Architecture Diagram (`README.md` / `docs/ARCHITECTURE.md`):**
- "ClaimKavach follows one strict rule: **AI Reads, Deterministic Rules Judge.**"
- "When a user uploads a PDF or photo, the browser compresses pages under 4 MB and sends them to `/api/extract`, where Gemini is strictly instructed to transcribe text and numbers into Zod-validated JSON—never to judge prices or invent facts."
- "After the family reviews the extracted table, a **100% pure TypeScript rules engine** (`src/lib/audit/**`) runs locally in the browser using integer-paise math and strict `YYYY-MM-DD` dates—guarded by ESLint so it can never import AI SDKs or make network calls."

### `1:30 – 3:30` | Live Deployed Demo
- **1:30–1:55 (Landing & 1-Click Demo):**
  - Show `/` on desktop and mobile width: point out the honest privacy notice (*"We store nothing. Your file is sent to Google Gemini only to read the text; the audit runs locally in your browser."*).
  - Click **Load Demo Bill** on Scenario A (**SYNTHETIC Sahyadri Care Demo Hospital — Aarav Sharma (Synthetic)**).
- **1:55–2:20 (Step 2 — Verify & Live Reconcile Bar):**
  - Show the `SYNTHETIC` badge, editable line items, `"I checked this"` toggles, and the sticky **Reconcile Bar**: Stated Bill Total `₹75,500.00` matches Extracted Sum of Lines `₹75,500.00` (`Reconciled`, `₹0.00` difference).
  - Click **Run Deterministic Audit**.
- **2:20–3:05 (Step 3 — Coverage, 5 Separate Tiers & Evidence):**
  - Show **Coverage Summary**: Arithmetic Checked `5 of 5`, Reference Checked `0 of 5`, Not Checked `1 items` (explicitly showing why *Coronary Drug Eluting Stent (DES)* for `₹48,000.00` is `Not Checked` because no verified NPPA PDF is currently loaded in `docs/sources/raw/`).
  - Show the **5 Separate Verdict Tiers** (never collapsed into an inflated savings number):
    - `Confirmed Issue` (`1 items`): *ICU Monitoring Charges (2 Days)* — `2 × ₹2,500.00 = ₹5,000.00`, billed `₹6,000.00`, difference `₹1,000.00`. Expand **View Evidence** to show the exact formula.
    - `Likely Issue` (`1 items`): *Troponin-I Rapid Assay (Repeat Billing)* — `₹1,500.00` matching earlier entry on `2026-11-16`.
    - `Needs Review` (`1 items`): *Pharmacy & Consumables Lump Sum* — `₹18,500.00` requesting an itemized MRP/batch breakup.
- **3:05–3:30 (Dispute Pack, Hindi/Listen & `/sources`):**
  - Show the **Polite Dispute Draft Pack** (4 tabs: Hospital Billing Query, Insurer Grievance Officer, Bima Bharosa / Grievance Portal, Insurance Ombudsman) with `[FILL IN: ...]` placeholders, the mandatory *"Verify before sending"* checklist, and 1-click Copy.
  - Toggle **हिंदी** in the header and point out **Listen to Report Summary** (which discloses if an online browser voice is used) and **Print / Save as PDF**.
  - Open **`/sources`** to show the SHA-256 provenance registry and honest Reference Data Status table.

### `3:30 – 4:20` | Technical Contribution & Code Quality
- Highlight the engineering rigor verified by automated tests:
  - ESLint purity boundary + programmatic violation test (`src/test/eslint-purity.test.ts`).
  - Integer-paise math & calendar date validation (`src/lib/currency.ts`, `src/lib/dates.ts`)—no float drift or timezone bugs.
  - Strict Zod boundaries at `/api/extract`, mapper, and `AuditReport`, plus `NODE_ENV === 'production'` mock-mode lockout.
  - WCAG AA contrast (`>= 4.5:1`), zero hardcoded hex outside `design-tokens.ts`, privacy-copy tests, and EN/HI key parity.

### `4:20 – 5:00` | Honest Limits & Closing
- "We are transparent about what ClaimKavach does not do: it is an educational verification tool—not legal or medical advice. Because no official government PDFs are bundled in `docs/sources/raw/` yet, regulatory price checks honestly report `NOT_CHECKED` rather than guessing numbers, and unverified records are hard-capped at `LIKELY`."
- "With ClaimKavach, families get clear math, zero hallucinated legal citations, and polite next steps right at the discharge counter. Thank you!"
