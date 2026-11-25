/**
 * ESLint Purity Boundary Test
 * ===========================
 * Proves that the ESLint rules in eslint.config.mjs correctly catch
 * purity violations in src/lib/audit/**, and that the real audit engine
 * passes cleanly with zero errors.
 */
import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import fs from 'fs';
import path from 'path';

describe('ESLint Purity Boundary', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  it('should catch all purity violations when linted under src/lib/audit/**', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/purity-violation.fixture.ts');
    const fixtureCode = fs.readFileSync(fixturePath, 'utf8');

    const eslint = new ESLint({
      cwd: projectRoot,
      overrideConfigFile: path.join(projectRoot, 'eslint.config.mjs'),
    });

    // Lint the violation code as a virtual file inside src/lib/audit/
    const results = await eslint.lintText(fixtureCode, {
      filePath: path.join(projectRoot, 'src/lib/audit/__purity_violation_probe__.ts'),
    });

    expect(results.length).toBe(1);
    const messages = results[0].messages;
    const ruleIds = new Set(messages.map((m) => m.ruleId));

    // Must catch forbidden imports (@google/generative-ai and @/lib/extract/**),
    // forbidden globals (fetch), and forbidden syntax (Date.now, new Date, Math.random, console.log)
    expect(ruleIds.has('no-restricted-imports')).toBe(true);
    expect(ruleIds.has('no-restricted-globals')).toBe(true);
    expect(ruleIds.has('no-restricted-syntax')).toBe(true);
    expect(results[0].errorCount).toBeGreaterThanOrEqual(7);
  }, 20000);

  it('should NOT flag any real files in src/lib/audit/**', async () => {
    const eslint = new ESLint({
      cwd: projectRoot,
      overrideConfigFile: path.join(projectRoot, 'eslint.config.mjs'),
    });

    const results = await eslint.lintFiles(['src/lib/audit/**/*.ts']);
    const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(totalErrors).toBe(0);
  }, 20000);
});
