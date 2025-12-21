import type { Check, CheckResult } from "../../types.ts";
import type { DepsContext } from "./context.ts";

function pass(name: string, message: string): CheckResult {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResult {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResult {
  return { name, status: "skip", message };
}

export const lockfileExists: Check<DepsContext> = {
  name: "lockfile-exists",
  description: "Check if a lockfile exists",
  tags: ["node", "required"],
  run: async (_global, { lockfileType }) => {
    if (!lockfileType) return fail("lockfile-exists", "No lockfile found");
    return pass("lockfile-exists", `Lockfile: ${lockfileType}`);
  },
};

export const knipInstalled: Check<DepsContext> = {
  name: "knip-installed",
  description: "Check if knip is installed for dead code detection",
  tags: ["node", "recommended", "tool:knip"],
  run: async (global, _ctx) => {
    if (!global.detected.hasKnip) {
      return fail("knip-installed", "knip not installed");
    }
    return pass("knip-installed", "knip installed");
  },
};

export const knipConfig: Check<DepsContext> = {
  name: "knip-config",
  description: "Check if knip configuration exists",
  tags: ["node", "recommended", "tool:knip"],
  run: async (global, _ctx) => {
    if (!global.detected.hasKnip) {
      return skip("knip-config", "knip not installed");
    }

    const [hasKnipJson, hasKnipTs] = await Promise.all([
      global.files.exists("knip.json"),
      global.files.exists("knip.ts"),
    ]);

    if (hasKnipJson || hasKnipTs) {
      return pass("knip-config", "knip config found");
    }
    return fail("knip-config", "No knip config found");
  },
};

export const checks = [lockfileExists, knipInstalled, knipConfig];
