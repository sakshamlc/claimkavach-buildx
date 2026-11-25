/**
 * DELIBERATE VIOLATION FIXTURE
 * ============================
 * This file intentionally violates the purity boundary rules.
 * It is linted by src/test/eslint-purity.test.ts as if it were inside
 * src/lib/audit/ to PROVE the ESLint guardrails catch every forbidden construct.
 * DO NOT fix these violations — they are the test.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractBill } from '@/lib/extract/mapper';

export function impureFunction() {
  const now = Date.now();
  const created = new Date();
  const random = Math.random();
  console.log('This should be blocked', now, created, random, GoogleGenerativeAI, extractBill);
  return fetch('https://example.com').then((r) => r.json());
}
