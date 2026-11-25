import { colors } from '@/lib/design-tokens';
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  CLIENT_BATCH_TARGET_BYTES,
  MAX_REQUEST_BYTES,
  type AllowedImageMimeType,
  type AllowedUploadMimeType,
  type ExtractImagePart,
  type ExtractRequest,
} from '@/lib/extract/schemas';

export type ClientPrepErrorCode =
  | 'UNSUPPORTED_MIME'
  | 'EMPTY_FILE'
  | 'CORRUPTED_FILE'
  | 'PAYLOAD_TOO_LARGE'
  | 'BROWSER_ONLY';

export class ClientPrepError extends Error {
  readonly code: ClientPrepErrorCode;

  constructor(code: ClientPrepErrorCode, message: string) {
    super(message);
    this.name = 'ClientPrepError';
    this.code = code;
  }
}

export interface PrepProgress {
  stage: 'validating' | 'rendering_pdf' | 'compressing' | 'batching';
  currentPage: number;
  totalPages: number;
  batchCount: number;
}

export interface PreparedUpload {
  batches: ExtractRequest[];
  pageCount: number;
  totalEstimatedBytes: number;
}

const MAX_DIMENSION_PX = 1800;
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4] as const;

/**
 * Resolve upload MIME type safely from File.type or extension fallback.
 */
export function resolveUploadMimeType(
  fileName: string,
  declaredMime: string,
): AllowedUploadMimeType {
  const normalizedMime = declaredMime.trim().toLowerCase();
  if ((ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(normalizedMime)) {
    return normalizedMime as AllowedUploadMimeType;
  }

  if (!normalizedMime) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
  }

  throw new ClientPrepError(
    'UNSUPPORTED_MIME',
    'Unsupported file format. Please upload a PDF, JPEG, PNG, or WebP bill.',
  );
}

/**
 * Measure exact UTF-8 byte length of a JSON payload without Node Buffer dependency.
 */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/**
 * Pure batch packer ensuring every `/api/extract` request payload stays strictly
 * below 4 MB (targeting `maxBatchBytes`, default 3.2 MB).
 */
export function packPagesIntoBatches(
  pages: ExtractImagePart[],
  maxBatchBytes: number = CLIENT_BATCH_TARGET_BYTES,
): ExtractRequest[] {
  if (pages.length === 0) {
    throw new ClientPrepError('CORRUPTED_FILE', 'No readable pages were found in this file.');
  }
  const effectiveBudget = Math.min(maxBatchBytes, MAX_REQUEST_BYTES - 16_384);
  const grouped: ExtractImagePart[][] = [];
  let current: ExtractImagePart[] = [];

  for (const page of pages) {
    const singlePayloadBytes = utf8ByteLength(
      JSON.stringify({ images: [page], batchIndex: 0, totalBatches: 1 }),
    );
    if (singlePayloadBytes > effectiveBudget) {
      throw new ClientPrepError(
        'PAYLOAD_TOO_LARGE',
        `Page ${page.pageNumber} exceeds the 4 MB upload limit even after compression.`,
      );
    }

    const candidate = [...current, page];
    const candidateBytes = utf8ByteLength(
      JSON.stringify({ images: candidate, batchIndex: 0, totalBatches: 99 }),
    );

    if (current.length > 0 && candidateBytes > effectiveBudget) {
      grouped.push(current);
      current = [page];
    } else {
      current = candidate;
    }
  }

  if (current.length > 0) {
    grouped.push(current);
  }

  const totalBatches = grouped.length;
  return grouped.map((images, batchIndex) => ({
    images,
    batchIndex,
    totalBatches,
  }));
}

function assertBrowserRuntime(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new ClientPrepError(
      'BROWSER_ONLY',
      'File rendering and compression must run in a browser environment.',
    );
  }
}

function canvasToBase64Jpeg(canvas: HTMLCanvasElement, quality: number): string {
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    throw new ClientPrepError('CORRUPTED_FILE', 'Could not encode bill page image.');
  }
  return dataUrl.slice(commaIdx + 1);
}

function compressCanvasToBudget(
  sourceCanvas: HTMLCanvasElement,
  pageNumber: number,
  perPageMaxBytes: number,
): ExtractImagePart {
  let workingCanvas = sourceCanvas;

  for (let scaleAttempt = 0; scaleAttempt < 3; scaleAttempt++) {
    for (const quality of QUALITY_STEPS) {
      const base64Data = canvasToBase64Jpeg(workingCanvas, quality);
      if (utf8ByteLength(base64Data) <= perPageMaxBytes) {
        return {
          mimeType: 'image/jpeg' as AllowedImageMimeType,
          base64Data,
          pageNumber,
        };
      }
    }

    // Downscale by 0.75x and retry quality steps
    const nextWidth = Math.max(400, Math.floor(workingCanvas.width * 0.75));
    const nextHeight = Math.max(400, Math.floor(workingCanvas.height * 0.75));
    const resized = document.createElement('canvas');
    resized.width = nextWidth;
    resized.height = nextHeight;
    const ctx = resized.getContext('2d');
    if (!ctx) {
      throw new ClientPrepError('CORRUPTED_FILE', 'Canvas rendering context unavailable.');
    }
    ctx.drawImage(workingCanvas, 0, 0, nextWidth, nextHeight);
    workingCanvas = resized;
  }

  throw new ClientPrepError(
    'PAYLOAD_TOO_LARGE',
    `Page ${pageNumber} is too large to fit under the 4 MB upload ceiling.`,
  );
}

async function renderImageFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    throw new ClientPrepError('CORRUPTED_FILE', 'Could not decode image file.');
  }

  try {
    const maxSide = Math.max(bitmap.width, bitmap.height);
    const scale = maxSide > MAX_DIMENSION_PX ? MAX_DIMENSION_PX / maxSide : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ClientPrepError('CORRUPTED_FILE', 'Canvas rendering context unavailable.');
    }
    ctx.fillStyle = colors.cardBg;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

async function renderPdfToPages(
  file: File,
  onProgress?: (progress: PrepProgress) => void,
): Promise<ExtractImagePart[]> {
  // Dynamic import keeps `pdfjs-dist` (and DOMMatrix usage) strictly browser-only.
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch {
    throw new ClientPrepError('CORRUPTED_FILE', 'Could not open this PDF file.');
  }

  const totalPages = pdfDoc.numPages;
  if (totalPages <= 0) {
    throw new ClientPrepError('CORRUPTED_FILE', 'PDF contains zero pages.');
  }

  const perPageBudget = Math.floor(CLIENT_BATCH_TARGET_BYTES * 0.85);
  const pages: ExtractImagePart[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({
      stage: 'rendering_pdf',
      currentPage: pageNum,
      totalPages,
      batchCount: 0,
    });

    const page = await pdfDoc.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxDim = Math.max(baseViewport.width, baseViewport.height);
    const scale = Math.min(2, MAX_DIMENSION_PX / Math.max(1, maxDim));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ClientPrepError('CORRUPTED_FILE', 'Canvas rendering context unavailable.');
    }

    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    onProgress?.({
      stage: 'compressing',
      currentPage: pageNum,
      totalPages,
      batchCount: 0,
    });

    pages.push(compressCanvasToBudget(canvas, pageNum, perPageBudget));
  }

  return pages;
}

/**
 * Prepare a user-selected PDF or image file for `/api/extract`:
 * - Validates MIME and non-empty file
 * - Renders PDF pages or compresses image in the browser
 * - Packs into batches strictly under 4 MB each
 */
export async function prepareBillUpload(
  file: File,
  onProgress?: (progress: PrepProgress) => void,
): Promise<PreparedUpload> {
  assertBrowserRuntime();

  onProgress?.({ stage: 'validating', currentPage: 0, totalPages: 1, batchCount: 0 });
  if (!file || file.size === 0) {
    throw new ClientPrepError('EMPTY_FILE', 'Selected file is empty.');
  }

  const mimeType = resolveUploadMimeType(file.name, file.type);
  const perPageBudget = Math.floor(CLIENT_BATCH_TARGET_BYTES * 0.85);

  const pages =
    mimeType === 'application/pdf'
      ? await renderPdfToPages(file, onProgress)
      : [
          compressCanvasToBudget(
            await renderImageFileToCanvas(file),
            1,
            perPageBudget,
          ),
        ];

  const batches = packPagesIntoBatches(pages, CLIENT_BATCH_TARGET_BYTES);
  const totalEstimatedBytes = batches.reduce(
    (sum, b) => sum + utf8ByteLength(JSON.stringify(b)),
    0,
  );

  onProgress?.({
    stage: 'batching',
    currentPage: pages.length,
    totalPages: pages.length,
    batchCount: batches.length,
  });

  return {
    batches,
    pageCount: pages.length,
    totalEstimatedBytes,
  };
}
