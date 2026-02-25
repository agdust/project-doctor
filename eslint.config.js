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
    },
  }
);
