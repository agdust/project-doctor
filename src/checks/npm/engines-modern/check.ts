import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { MIN_SUPPORTED_MAJOR, LTS_VERSIONS } from "../constants.js";

const name = "npm-engines-modern";

// Extract the minimum major version from an engines.node range
function extractMinMajor(value: string): number | null {
  // Handle various formats: >=18, ^18, ~18, 18, 18.x, etc.
  const patterns = [
    />=?\s*(\d+)/, // >=18, >18
    /\^(\d+)/, // ^18
    /~(\d+)/, // ~18
    /^(\d+)/, // 18, 18.x, 18.0.0
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

export const check: Check<NpmContext> = {
  name,
  description: "Check if engines.node specifies a modern, supported Node version",
  tags: ["node", "recommended"],
  run: async (_global, { engines }) => {
    if (!engines.node) {
      return skip(name, "No engines.node defined");
    }

    const minMajor = extractMinMajor(engines.node);
    if (minMajor === null) {
      return skip(name, `Cannot parse minimum version from: ${engines.node}`);
    }

    if (minMajor < MIN_SUPPORTED_MAJOR) {
      // Check if it's an EOL version
      const isEol = !LTS_VERSIONS.some((v) => v.major === minMajor);
      if (isEol || minMajor < 18) {
        return fail(
          name,
          `Node ${minMajor} is EOL. Minimum supported: ${MIN_SUPPORTED_MAJOR}`
        );
      }
    }

    const ltsInfo = LTS_VERSIONS.find((v) => v.major === minMajor);
    if (ltsInfo) {
      return pass(name, `Minimum Node ${minMajor} (${ltsInfo.codename})`);
    }

    return pass(name, `Minimum Node ${minMajor}`);
  },
};
