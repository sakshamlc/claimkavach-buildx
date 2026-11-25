import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/test/fixtures/**",
  ]),

  // ═══════════════════════════════════════════════════════════════════════════
  // PURITY BOUNDARY: src/lib/audit/** must remain 100% pure TypeScript.
  // No network calls, no AI SDK, no Date.now(), no Math.random(), no I/O.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    files: ["src/lib/audit/**/*.ts"],
    rules: {
      // Block imports from AI/extraction/API modules
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["@google/generative-ai", "@google/generative-ai/*"], message: "AI SDK imports are forbidden in the pure audit engine." },
          { group: ["ai", "ai/*"], message: "AI SDK imports are forbidden in the pure audit engine." },
          { group: ["**/extract/**", "**/api/**"], message: "Extract/API imports are forbidden in the pure audit engine." },
          { group: ["fs", "fs/*", "path", "net", "http", "https", "node:*"], message: "Node.js I/O modules are forbidden in the pure audit engine." },
        ],
      }],
      // Block non-deterministic globals
      "no-restricted-globals": ["error",
        { name: "fetch", message: "Network calls are forbidden in the pure audit engine." },
        { name: "XMLHttpRequest", message: "Network calls are forbidden in the pure audit engine." },
      ],
      // Block non-deterministic syntax patterns
      "no-restricted-syntax": ["error",
        { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: "Date.now() is forbidden in the pure audit engine. Pass dates as ISO strings." },
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: "new Date() is forbidden in the pure audit engine. Pass dates as ISO strings." },
        { selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']", message: "Math.random() is forbidden in the pure audit engine." },
        { selector: "CallExpression[callee.property.name='log']", message: "console.log is forbidden in the pure audit engine. Return data instead." },
      ],
    },
  },
]);

export default eslintConfig;
