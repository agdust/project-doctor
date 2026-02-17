import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
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
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Allow non-null assertions in specific cases
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Allow empty functions for callbacks/handlers
      "@typescript-eslint/no-empty-function": "off",

      // Relax for CLI output formatting
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],

      // Allow any in type assertions for external data
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",

      // Console is expected in CLI
      "no-console": "off",

      // Allow async functions without await (for interface consistency)
      "@typescript-eslint/require-await": "off",

      // Allow type aliases (not just interfaces)
      "@typescript-eslint/consistent-type-definitions": "off",

      // Relax unnecessary condition checks (false positives with type guards)
      "@typescript-eslint/no-unnecessary-condition": "off",

      // Allow void in union types (for Promise<void | T>)
      "@typescript-eslint/no-invalid-void-type": "off",

      // Allow control characters in regex (for ANSI escape codes)
      "no-control-regex": "off",

      // Allow dynamic delete (for cache cleanup)
      "@typescript-eslint/no-dynamic-delete": "off",

      // Allow single-use type parameters (useful for type inference)
      "@typescript-eslint/no-unnecessary-type-parameters": "off",

      // Allow unknown in catch (we handle errors appropriately)
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",

      // Relax plus operands (for any types being added)
      "@typescript-eslint/restrict-plus-operands": "warn",

      // Allow deprecated APIs (builtinRules from eslint/use-at-your-own-risk)
      "@typescript-eslint/no-deprecated": "warn",
    },
  }
);
