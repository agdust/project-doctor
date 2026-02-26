import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import importX from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import regexp from "eslint-plugin-regexp";
import promise from "eslint-plugin-promise";
import { defineConfig } from "eslint/config";

export default defineConfig(
  // Ignore patterns
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "scripts/**",
      "src/test/fixtures/**",
      "**/*.test.ts",
      "src/test/**",
      "eslint.config.js",
      "vitest.config.ts",
    ],
  },

  // Base ESLint recommended
  eslint.configs.recommended,

  // TypeScript strict configuration
  ...tseslint.configs.strictTypeChecked,

  // Unicorn recommended
  unicorn.configs["recommended"],

  // Import-x TypeScript config
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  // Node.js recommended
  nodePlugin.configs["flat/recommended-module"],

  // Regexp recommended
  regexp.configs["flat/recommended"],

  // Promise recommended
  promise.configs["flat/recommended"],

  // TypeScript parser options
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Project-specific rules
  {
    rules: {
      // =========================================================================
      // @typescript-eslint overrides
      // =========================================================================

      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Relax for CLI output formatting
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],

      // Console is expected in CLI
      "no-console": "off",

      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": "error",

      // Require exhaustive switch statements on union types
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      // Mark class members that are never reassigned as readonly
      "@typescript-eslint/prefer-readonly": "error",

      // Require explicit boolean expressions in conditionals
      "@typescript-eslint/strict-boolean-expressions": [
        "error"
      ],

      // Require braces on all control flow statements
      curly: ["error", "all"],

      // Ban nested ternary expressions
      "no-nested-ternary": "error",

      // Ban dynamic import() — use static imports instead
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression",
          message: "Dynamic import() is not allowed. Use static imports instead.",
        },
      ],

      // Flag TODO/FIXME/HACK comments as warnings
      "no-warning-comments": "warn",

      // Relax unnecessary condition checks (false positives with type guards)
      "@typescript-eslint/no-unnecessary-condition": "off",

      // Allow single-use type parameters (useful for type inference)
      "@typescript-eslint/no-unnecessary-type-parameters": "off",

      // Allow control characters in regex (for ANSI escape codes)
      "no-control-regex": "off",

      // =========================================================================
      // unicorn overrides
      // =========================================================================

      // Use core no-nested-ternary (ban) instead of unicorn (parenthesize)
      "unicorn/no-nested-ternary": "off",

      // Allow abbreviations (ctx, args, opts, pkg, etc. are idiomatic)
      "unicorn/prevent-abbreviations": "off",

      // Allow null — used for JSON compat and intentional absence
      "unicorn/no-null": "off",

      // Don't force top-level await (CLI entry point pattern)
      "unicorn/prefer-top-level-await": "off",

      // Allow process.exit in CLI tool
      "unicorn/no-process-exit": "off",

      // conflicts with prettier
      "unicorn/number-literal-case": "off",

      // =========================================================================
      // eslint-plugin-n overrides
      // =========================================================================

      // Handled by TypeScript — false positives with .js extensions in ESM
      "n/no-missing-import": "off",

      // Handled by TypeScript
      "n/no-unpublished-import": "off",

      // Allow process.exit in CLI tool
      "n/no-process-exit": "off",

      // =========================================================================
      // eslint-plugin-import-x overrides
      // =========================================================================

      // Handled by TypeScript resolver
      "import-x/no-unresolved": "off",

      // Allow namespace usage for JSON5 and similar libraries
      "import-x/no-named-as-default-member": "off",

      // =========================================================================
      // eslint-plugin-promise overrides
      // =========================================================================

      // Allow async/await style (no need to always return promise)
      "promise/always-return": "off",
    },
  }
);
