import type { Check, CheckResultBase } from "../../types.js";
import type { NvmrcContext } from "./context.js";

function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

function warn(name: string, message: string): CheckResultBase {
  return { name, status: "warn", message };
}

export const exists: Check<NvmrcContext> = {
  name: "nvmrc-exists",
  description: "Check if .nvmrc file exists",
  tags: ["node", "recommended"],
  run: async (_global, { raw }) => {
    if (!raw) return fail("nvmrc-exists", ".nvmrc not found");
    return pass("nvmrc-exists", ".nvmrc exists");
  },
};

export const validFormat: Check<NvmrcContext> = {
  name: "nvmrc-valid-format",
  description: "Check if .nvmrc has valid Node version format",
  tags: ["node", "recommended"],
  run: async (_global, { raw, version }) => {
    if (!raw) return skip("nvmrc-valid-format", "No .nvmrc");
    if (!version) return fail("nvmrc-valid-format", "Empty .nvmrc");

    const validPatterns = [
      /^\d+$/, // 20
      /^\d+\.\d+$/, // 20.10
      /^\d+\.\d+\.\d+$/, // 20.10.0
      /^v\d+$/, // v20
      /^v\d+\.\d+$/, // v20.10
      /^v\d+\.\d+\.\d+$/, // v20.10.0
      /^lts\/\w+$/, // lts/iron
    ];

    const isValid = validPatterns.some((p) => p.test(version));
    if (!isValid) return fail("nvmrc-valid-format", `Invalid format: ${version}`);
    return pass("nvmrc-valid-format", `Version: ${version}`);
  },
};

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

export const modernVersion: Check<NvmrcContext> = {
  name: "nvmrc-modern-version",
  description: "Check if .nvmrc specifies a modern, supported Node version",
  tags: ["node", "recommended"],
  run: async (_global, { raw, version }) => {
    if (!raw) return skip("nvmrc-modern-version", "No .nvmrc");
    if (!version) return skip("nvmrc-modern-version", "Empty .nvmrc");

    const major = parseMajorVersion(version);
    if (major === null) {
      return skip("nvmrc-modern-version", `Cannot parse version: ${version}`);
    }

    if (major < MIN_SUPPORTED_MAJOR) {
      return fail(
        "nvmrc-modern-version",
        `Node ${major} is EOL. Minimum supported: ${MIN_SUPPORTED_MAJOR}`
      );
    }

    const ltsInfo = LTS_VERSIONS.find((v) => v.major === major);
    if (ltsInfo) {
      const isLatestLts = major === CURRENT_LTS_MAJOR;
      if (isLatestLts) {
        return pass("nvmrc-modern-version", `Node ${major} (${ltsInfo.codename}) - latest LTS`);
      }
      return pass("nvmrc-modern-version", `Node ${major} (${ltsInfo.codename}) - LTS until ${ltsInfo.eol}`);
    }

    // Odd version numbers are not LTS
    if (major % 2 !== 0) {
      return warn("nvmrc-modern-version", `Node ${major} is not an LTS version`);
    }

    return pass("nvmrc-modern-version", `Node ${major}`);
  },
};

export const checks = [exists, validFormat, modernVersion];
