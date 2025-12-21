import type { Check, CheckResult } from "../../types.ts";
import type { NvmrcContext } from "./context.ts";

function pass(name: string, message: string): CheckResult {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResult {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResult {
  return { name, status: "skip", message };
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

export const checks = [exists, validFormat];
