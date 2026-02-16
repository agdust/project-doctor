/**
 * Check: ci-uses-lockfile
 *
 * Verifies that CI workflows use deterministic installation commands
 * (npm ci, --frozen-lockfile) instead of npm install.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import type { Check } from "../../../types.js";
import type { NpmSecurityContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "npm-security-ci-lockfile";

// Patterns for deterministic installation commands
const GOOD_PATTERNS = [
  /npm\s+ci\b/,
  /yarn\s+install\s+--immutable/,
  /yarn\s+--immutable/,
  /pnpm\s+install\s+--frozen-lockfile/,
  /pnpm\s+i\s+--frozen-lockfile/,
  /bun\s+install\s+--frozen-lockfile/,
  /bun\s+i\s+--frozen-lockfile/,
];

// Patterns for non-deterministic installation (bad in CI)
const BAD_PATTERNS = [
  /npm\s+install\b(?!\s+--)/,  // npm install without flags
  /npm\s+i\b(?!\s+--)/,        // npm i without flags
];

export const check: Check<NpmSecurityContext> = {
  name,
  description: "Check if CI uses deterministic package installation (npm ci / --frozen-lockfile)",
  tags: ["node", "recommended", "effort:low", "security", "source:lirantal-npm-security"],
  run: async (_global, { ciWorkflows }) => {
    if (ciWorkflows.length === 0) {
      return skip(name, "No CI workflow files found");
    }

    const allWorkflowContent = ciWorkflows.join("\n");

    // Check if any workflow has npm install (bad)
    const hasNpmInstall = BAD_PATTERNS.some((pattern) => pattern.test(allWorkflowContent));

    // Check if any workflow has deterministic install (good)
    const hasDeterministicInstall = GOOD_PATTERNS.some((pattern) =>
      pattern.test(allWorkflowContent)
    );

    if (hasDeterministicInstall && !hasNpmInstall) {
      return pass(name, "CI uses deterministic package installation");
    }

    if (hasNpmInstall) {
      return fail(
        name,
        "CI uses 'npm install' instead of 'npm ci' - this can lead to inconsistent installations"
      );
    }

    // No install commands found at all - might use a different approach
    return skip(name, "No package installation commands found in CI workflows");
  },
};
