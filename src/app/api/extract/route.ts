import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import {
  ExtractRequestSchema,
  MAX_REQUEST_BYTES,
  RawExtractionSchema,
  type RawExtraction,
} from '@/lib/extract/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Best-effort in-memory per-IP rate limiter.
 * Note: In serverless deployments (e.g. Vercel), each instance maintains its own
 * memory map; this mitigates burst abuse per warm instance rather than acting as
 * a global distributed quota.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const ipRequestLog = new Map<string, number[]>();

function isRateLimited(ipKey: string, nowMs: number): boolean {
  const windowStart = nowMs - RATE_LIMIT_WINDOW_MS;
  const recent = (ipRequestLog.get(ipKey) ?? []).filter((ts) => ts > windowStart);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipRequestLog.set(ipKey, recent);
    return true;
  }
  recent.push(nowMs);
  ipRequestLog.set(ipKey, recent);
  return false;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function jsonNoStore(payload: unknown, status: number): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

const TRANSCRIPTION_PROMPT = `You are a careful medical bill transcription assistant.
Read the uploaded Indian hospital bill or insurer/TPA deduction sheet image(s) and transcribe ONLY what is visibly printed into valid JSON matching this exact shape:
{
  "hospitalName": string,
  "patientName": string,
  "billDate": "YYYY-MM-DD" | null,
  "statedTotalRupees": number,
  "lineItems": [
    {
      "rawDescription": string,
      "normalizedName": string,
      "category": "stent" | "implant" | "pharmacy" | "consumables" | "room_rent" | "diagnostics" | "procedure" | "doctor_fee" | "other",
      "quantity": number,
      "unit": string,
      "strengthOrSpec": string | null,
      "unitPriceRupees": number,
      "lineTotalRupees": number,
      "date": "YYYY-MM-DD" | null,
      "confidenceNote": string | null
    }
  ],
  "tpaDeductions": [
    {
      "description": string,
      "claimedRupees": number,
      "deductedRupees": number,
      "reasonText": string,
      "category": string
    }
  ],
  "extractionWarnings": string[]
}

Strict rules:
1. Transcribe ONLY printed numbers and text. Do NOT invent missing prices, quantities, or dates.
2. Do NOT judge prices, do NOT decide whether any charge is excessive, and do NOT make legal accusations.
3. Convert numeric currency strings (e.g. "1,25,000.00") into plain JSON numbers in rupees (125000).
4. Return ONLY valid JSON with no markdown fences or commentary.`;

function buildMockExtraction(): RawExtraction {
  return RawExtractionSchema.parse({
    hospitalName: 'SYNTHETIC Sahyadri Care Demo Hospital',
    patientName: 'Aarav Sharma (Mock Extract)',
    billDate: '2026-11-18',
    statedTotalRupees: 69500,
    lineItems: [
      {
        rawDescription: 'Coronary Drug Eluting Stent (DES)',
        normalizedName: 'Coronary Drug Eluting Stent (DES)',
        category: 'stent',
        quantity: 1,
        unit: 'unit',
        strengthOrSpec: 'DES',
        unitPriceRupees: 48000,
        lineTotalRupees: 48000,
        date: '2026-11-16',
        confidenceNote: 'Mock mode sample item',
      },
      {
        rawDescription: 'Troponin-I Rapid Assay',
        normalizedName: 'Troponin I Rapid Assay',
        category: 'diagnostics',
        quantity: 1,
        unit: 'test',
        strengthOrSpec: 'quantitative',
        unitPriceRupees: 1500,
        lineTotalRupees: 1500,
        date: '2026-11-16',
        confidenceNote: null,
      },
      {
        rawDescription: 'Troponin-I Rapid Assay',
        normalizedName: 'Troponin I Rapid Assay',
        category: 'diagnostics',
        quantity: 1,
        unit: 'test',
        strengthOrSpec: 'quantitative',
        unitPriceRupees: 1500,
        lineTotalRupees: 1500,
        date: '2026-11-16',
        confidenceNote: null,
      },
      {
        rawDescription: 'Pharmacy & Consumables Lump Sum',
        normalizedName: 'Pharmacy Lump Sum',
        category: 'pharmacy',
        quantity: 1,
        unit: 'lump_sum',
        strengthOrSpec: null,
        unitPriceRupees: 18500,
        lineTotalRupees: 18500,
        date: '2026-11-18',
        confidenceNote: null,
      },
    ],
    tpaDeductions: [],
    extractionWarnings: ['Mock extraction response (local non-production mode).'],
  });
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return trimmed;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Best-effort in-memory rate limit
  if (isRateLimited(getClientIp(request), Date.now())) {
    return jsonNoStore(
      {
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a minute before trying again.',
      },
      429,
    );
  }

  // 2. Enforce strict 4 MB payload ceiling via Content-Length and actual body bytes
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return jsonNoStore(
        {
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Upload batch exceeds the 4 MB request limit. Please split or compress pages.',
        },
        413,
      );
    }
  }

  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
  } catch {
    return jsonNoStore(
      { error: 'INVALID_REQUEST', message: 'Could not read request payload.' },
      400,
    );
  }

  if (Buffer.byteLength(rawBodyText, 'utf8') > MAX_REQUEST_BYTES) {
    return jsonNoStore(
      {
        error: 'PAYLOAD_TOO_LARGE',
        message: 'Upload batch exceeds the 4 MB request limit. Please split or compress pages.',
      },
      413,
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBodyText);
  } catch {
    return jsonNoStore(
      { error: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
      400,
    );
  }

  const parsedRequest = ExtractRequestSchema.safeParse(parsedJson);
  if (!parsedRequest.success) {
    return jsonNoStore(
      {
        error: 'INVALID_REQUEST',
        message: 'Invalid upload payload. Provide 1 to 12 valid JPEG, PNG, or WebP page images.',
      },
      400,
    );
  }

  // 3. Mock mode allowed ONLY when NODE_ENV !== 'production'
  const isMockAllowed =
    process.env.NODE_ENV !== 'production' && process.env.EXTRACT_MOCK === 'true';

  if (isMockAllowed) {
    return jsonNoStore(
      {
        mode: 'mock',
        batchIndex: parsedRequest.data.batchIndex,
        totalBatches: parsedRequest.data.totalBatches,
        extraction: buildMockExtraction(),
      },
      200,
    );
  }

  // 4. Read model strictly from process.env.GEMINI_MODEL (no hardcoded fallback)
  const modelName = process.env.GEMINI_MODEL?.trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!modelName || !apiKey) {
    return jsonNoStore(
      {
        error: 'EXTRACTION_NOT_CONFIGURED',
        message: 'Bill reading service is not configured on this server.',
      },
      503,
    );
  }

  // 5. Call Gemini for transcription-only extraction (never log bill contents or API key)
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const parts = [
      { text: TRANSCRIPTION_PROMPT },
      ...parsedRequest.data.images.map((img) => ({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64Data,
        },
      })),
    ];

    const result = await model.generateContent(parts);
    const rawOutputText = result.response.text();

    let modelJson: unknown;
    try {
      modelJson = JSON.parse(stripJsonFences(rawOutputText));
    } catch {
      return jsonNoStore(
        {
          error: 'UNPROCESSABLE_EXTRACTION',
          message: 'Could not parse structured bill items from this document. Please try a clearer scan or photo.',
        },
        422,
      );
    }

    const validatedExtraction = RawExtractionSchema.safeParse(modelJson);
    if (!validatedExtraction.success) {
      return jsonNoStore(
        {
          error: 'UNPROCESSABLE_EXTRACTION',
          message: 'Extracted bill fields were incomplete or invalid. Please retry with a clearer image.',
        },
        422,
      );
    }

    return jsonNoStore(
      {
        mode: 'gemini',
        batchIndex: parsedRequest.data.batchIndex,
        totalBatches: parsedRequest.data.totalBatches,
        extraction: validatedExtraction.data,
      },
      200,
    );
  } catch {
    return jsonNoStore(
      {
        error: 'EXTRACTION_FAILED',
        message: 'Bill reading failed unexpectedly. Please try again in a moment.',
      },
      500,
    );
  }
}
