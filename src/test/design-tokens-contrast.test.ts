/**
 * Design Token Contrast & No-Hardcoded-Hex Tests
 * ===============================================
 * 1. Verifies all critical text/background color pairs meet WCAG AA
 *    contrast ratio requirements (>= 4.5:1 for normal text).
 * 2. Verifies NO hardcoded hex colors exist in components/pages outside
 *    src/lib/design-tokens.ts and src/app/globals.css (@theme tokens).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { contrastPairs, colors } from '@/lib/design-tokens';

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function walkTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('Design Token Contrast (WCAG AA)', () => {
  for (const pair of contrastPairs) {
    it(`${pair.label}: ${pair.foreground} on ${pair.background} >= ${pair.minRatio}:1`, () => {
      const ratio = contrastRatio(pair.foreground, pair.background);
      expect(ratio).toBeGreaterThanOrEqual(pair.minRatio);
    });
  }
});

describe('No Hardcoded Hex Outside Token File', () => {
  it('all colors in design-tokens.ts should be valid 6-digit hex', () => {
    expect(Object.keys(colors).length).toBeGreaterThan(10);
    for (const [key, value] of Object.entries(colors)) {
      expect(value, `Color "${key}" should be a hex color`).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('no UI component or page should contain hardcoded hex literals', () => {
    const srcRoot = path.resolve(__dirname, '..');
    const files = walkTsFiles(srcRoot).filter((f) => {
      const rel = path.relative(srcRoot, f).replace(/\\/g, '/');
      return rel !== 'lib/design-tokens.ts' && !rel.startsWith('test/');
    });

    const hexRegex = /#[0-9A-Fa-f]{3,8}\b/g;
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(hexRegex);
      if (matches && matches.length > 0) {
        const rel = path.relative(srcRoot, file).replace(/\\/g, '/');
        violations.push(`${rel}: ${matches.join(', ')}`);
      }
    }

    expect(violations, `Hardcoded hex values found: ${violations.join('; ')}`).toEqual([]);
  });
});
