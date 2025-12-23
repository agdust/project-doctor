import type { Check } from "../../../types.js";
import type { NvmrcContext } from "../context.js";
import { pass, fail, warn, skip } from "../../helpers.js";

const name = "nvmrc-modern-version";

// LTS versions with their codenames and EOL dates
// https://nodejs.org/en/about/previous-releases
const LTS_VERSIONS = [
  { major: 18, codename: "hydrogen", eol: "2025-04-30" },
  { major: 20, codename: "iron", eol: "2026-04-30" },
  { major: 22, codename: "jod", eol: "2027-04-30" },
] as const;

const CURRENT_LTS_MAJOR = 22;
const MIN_SUPPORTED_MAJOR = 18;

function parseMajorVersion(version: string): number | null {
  // Handle lts/codename format
  const ltsMatch = version.match(/^lts\/(\w+)$/i);
  if (ltsMatch) {
    const codename = ltsMatch[1].toLowerCase();
    const lts = LTS_VERSIONS.find((v) => v.codename === codename);
    return lts?.major ?? null;
  }

  // Handle numeric versions (with or without v prefix)
  const numMatch = version.match(/^v?(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return null;
}

export const check: Check<NvmrcContext> = {
  name,
  description: "Check if .nvmrc specifies a modern, supported Node version",
  tags: ["node", "recommended"],
  run: async (_global, { raw, version }) => {
    if (!raw) return skip(name, "No .nvmrc");
    if (!version) return skip(name, "Empty .nvmrc");

    const major = parseMajorVersion(version);
    if (major === null) {
      return skip(name, `Cannot parse version: ${version}`);
    }

    if (major < MIN_SUPPORTED_MAJOR) {
      return fail(
        name,
        `Node ${major} is EOL. Minimum supported: ${MIN_SUPPORTED_MAJOR}`
      );
    }

    const ltsInfo = LTS_VERSIONS.find((v) => v.major === major);
    if (ltsInfo) {
      const isLatestLts = major === CURRENT_LTS_MAJOR;
      if (isLatestLts) {
        return pass(name, `Node ${major} (${ltsInfo.codename}) - latest LTS`);
      }
      return pass(name, `Node ${major} (${ltsInfo.codename}) - LTS until ${ltsInfo.eol}`);
    }

    // Odd version numbers are not LTS
    if (major % 2 !== 0) {
      return warn(name, `Node ${major} is not an LTS version`);
    }

    return pass(name, `Node ${major}`);
  },
};
