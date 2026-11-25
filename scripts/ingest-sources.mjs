/**
 * Deterministic Reference Source Verification & Ingestion Script
 * ==============================================================
 * Scans `docs/sources/raw/` for official regulatory documents (excluding README.md),
 * computes SHA-256 hashes, cross-checks `docs/sources/REVIEW.json` for matching
 * human-verified hashes, and regenerates `src/lib/reference/dataset.ts`.
 *
 * Rules:
 * - Every ingested record defaults to `verified: false`.
 * - A record is flipped to `verified: true` ONLY if `docs/sources/REVIEW.json`
 *   contains an entry with matching `fileName`, matching `sha256`, and `approved: true`.
 * - If no raw documents exist, emits an empty dataset so the engine reports
 *   `NOT_CHECKED` rather than inventing prices or regulatory facts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, 'docs', 'sources', 'raw');
const REVIEW_PATH = path.join(ROOT, 'docs', 'sources', 'REVIEW.json');
const OUT_PATH = path.join(ROOT, 'src', 'lib', 'reference', 'dataset.ts');

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function main() {
  const rawEntries = fs.existsSync(RAW_DIR)
    ? fs
        .readdirSync(RAW_DIR, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.toLowerCase() !== 'readme.md')
        .map((d) => d.name)
        .sort()
    : [];

  const reviewRaw = fs.existsSync(REVIEW_PATH)
    ? JSON.parse(fs.readFileSync(REVIEW_PATH, 'utf8'))
    : { reviews: [] };
  const reviews = Array.isArray(reviewRaw.reviews) ? reviewRaw.reviews : [];

  const sources = [];
  const prices = [];
  const tpaExclusions = [];

  for (const fileName of rawEntries) {
    const fullPath = path.join(RAW_DIR, fileName);
    const fileHash = sha256File(fullPath);
    const reviewEntry = reviews.find(
      (r) => r && r.fileName === fileName && r.sha256 === fileHash && r.approved === true,
    );
    const isVerified = Boolean(reviewEntry);

    const parsedJsonPath = fullPath.replace(/\.pdf$/i, '.parsed.json');
    let parsedRecords = { prices: [], tpaExclusions: [], title: fileName, instrumentNumber: 'PENDING', instrumentDate: '1970-01-01' };
    if (fs.existsSync(parsedJsonPath)) {
      parsedRecords = JSON.parse(fs.readFileSync(parsedJsonPath, 'utf8'));
    }

    const filePrices = (parsedRecords.prices ?? []).map((rec) => ({
      ...rec,
      sourceFileHash: fileHash,
      verified: isVerified,
    }));
    const fileExclusions = (parsedRecords.tpaExclusions ?? []).map((rec) => ({
      ...rec,
      sourceFileHash: fileHash,
      verified: isVerified,
    }));

    prices.push(...filePrices);
    tpaExclusions.push(...fileExclusions);
    sources.push({
      id: `src_${fileHash.slice(0, 12)}`,
      title: parsedRecords.title ?? fileName,
      instrumentNumber: parsedRecords.instrumentNumber ?? 'PENDING',
      instrumentDate: parsedRecords.instrumentDate ?? '1970-01-01',
      sha256: fileHash,
      verified: isVerified,
      recordCount: filePrices.length + fileExclusions.length,
    });
  }

  const output = `import type { ReferenceDataset } from '@/lib/schemas/audit';

/**
 * Static Reference Dataset (Vercel-Safe, Zero Runtime FS Reads)
 * ==============================================================
 * Generated deterministically by scripts/ingest-sources.mjs.
 * Raw files scanned: ${rawEntries.length}
 */
export const DEFAULT_REFERENCE_DATASET: ReferenceDataset = ${JSON.stringify(
    { prices, tpaExclusions, sources },
    null,
    2,
  )};
`;

  fs.writeFileSync(OUT_PATH, output, 'utf8');
  console.log(
    `Ingested ${rawEntries.length} source file(s): ${prices.length} price record(s), ${tpaExclusions.length} TPA exclusion rule(s).`,
  );
}

main();
