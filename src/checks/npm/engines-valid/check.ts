import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "npm-engines-valid";

/**
 * Valid semver range patterns for engines.node field.
 *
 * These patterns cover the most common version specifications:
 * - Exact versions: "20", "20.10", "20.10.0"
 * - Range operators: ">=20", "<=20", "^20", "~20"
 * - Hyphen ranges: "18 - 22"
 * - OR combinations: "18 || 20", ">=18 || >=20"
 * - Combined ranges: ">=18 <23"
 * - Wildcard: "*"
 *
 * Note: This is intentionally not a full semver parser. It validates
 * common patterns that work with Node.js version checking.
 */
const VALID_PATTERNS = [
  /^\d+$/, // Exact major: "20"
  /^\d+\.\d+$/, // Exact major.minor: "20.10"
  /^\d+\.\d+\.\d+$/, // Exact version: "20.10.0"
  /^>=?\s*\d+(\.\d+)?(\.\d+)?$/, // Greater than: ">=20", ">= 20.10"
  /^<=?\s*\d+(\.\d+)?(\.\d+)?$/, // Less than: "<=20", "< 20.10"
  /^\^?\d+(\.\d+)?(\.\d+)?$/, // Caret range: "^20", "^20.10.0"
  /^~?\d+(\.\d+)?(\.\d+)?$/, // Tilde range: "~20", "~20.10.0"
  /^\d+(\.\d+)?(\.\d+)?\s*-\s*\d+(\.\d+)?(\.\d+)?$/, // Hyphen range: "18 - 22"
  /^\d+(\.\d+)?(\.\d+)?\s*\|\|\s*\d+(\.\d+)?(\.\d+)?$/, // OR: "18 || 20"
  /^>=?\s*\d+(\.\d+)?(\.\d+)?\s*<\s*\d+(\.\d+)?(\.\d+)?$/, // Combined: ">=18 <23"
  /^\*$/, // Wildcard: "*"
  /^>=?\s*\d+(\.\d+)?(\.\d+)?(\s*\|\|\s*>=?\s*\d+(\.\d+)?(\.\d+)?)*$/, // Multiple OR: ">=18 || >=20"
];

function isValidEnginesNode(value: string): boolean {
  const trimmed = value.trim();
  return VALID_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export const check: Check<NpmContext> = {
  name,
  description: "Check if engines.node has valid semver range format",
  tags: ["node", "recommended", "effort:low"],
  run: (_global, { engines }) => {
    if (engines.node === null) {
      return skip(name, "No engines.node defined");
    }

    if (!isValidEnginesNode(engines.node)) {
      return fail(name, `Invalid engines.node format: ${engines.node}`);
    }

    return pass(name, `Valid format: ${engines.node}`);
  },
};
