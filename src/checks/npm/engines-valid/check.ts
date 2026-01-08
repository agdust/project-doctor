import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "npm-engines-valid";

// Valid semver range patterns
const VALID_PATTERNS = [
  /^\d+$/, // 20
  /^\d+\.\d+$/, // 20.10
  /^\d+\.\d+\.\d+$/, // 20.10.0
  /^>=?\s*\d+(\.\d+)?(\.\d+)?$/, // >=20, >= 20.10, >=20.10.0
  /^<=?\s*\d+(\.\d+)?(\.\d+)?$/, // <=20, <= 20.10
  /^\^?\d+(\.\d+)?(\.\d+)?$/, // ^20, ^20.10, ^20.10.0
  /^~?\d+(\.\d+)?(\.\d+)?$/, // ~20, ~20.10, ~20.10.0
  /^\d+(\.\d+)?(\.\d+)?\s*-\s*\d+(\.\d+)?(\.\d+)?$/, // 18 - 22, 18.0.0 - 22.0.0
  /^\d+(\.\d+)?(\.\d+)?\s*\|\|\s*\d+(\.\d+)?(\.\d+)?$/, // 18 || 20
  /^>=?\s*\d+(\.\d+)?(\.\d+)?\s*<\s*\d+(\.\d+)?(\.\d+)?$/, // >=18 <23, >=18.0.0 <23.0.0
  /^\*$/, // *
  /^>=?\s*\d+(\.\d+)?(\.\d+)?(\s*\|\|\s*>=?\s*\d+(\.\d+)?(\.\d+)?)*$/, // >=18 || >=20
];

function isValidEnginesNode(value: string): boolean {
  const trimmed = value.trim();
  return VALID_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export const check: Check<NpmContext> = {
  name,
  description: "Check if engines.node has valid semver range format",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, { engines }) => {
    if (!engines.node) {
      return skip(name, "No engines.node defined");
    }

    if (!isValidEnginesNode(engines.node)) {
      return fail(name, `Invalid engines.node format: ${engines.node}`);
    }

    return pass(name, `Valid format: ${engines.node}`);
  },
};
