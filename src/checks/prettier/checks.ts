import type { Check, CheckResultBase } from "../../types.js";
import type { PrettierContext } from "./context.js";

function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

function warn(name: string, message: string): CheckResultBase {
  return { name, status: "warn", message };
}

function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

export const configExists: Check<PrettierContext> = {
  name: "prettierrc-exists",
  description: "Check if Prettier configuration exists",
  tags: ["node", "recommended", "tool:prettier"],
  run: async (global, { hasConfig }) => {
    if (!global.detected.hasPrettier) {
      return skip("prettierrc-exists", "Prettier not detected");
    }
    if (!hasConfig) {
      return fail("prettierrc-exists", "No Prettier config found");
    }
    return pass("prettierrc-exists", "Prettier configured");
  },
};

export const ignoreExists: Check<PrettierContext> = {
  name: "prettier-ignore-exists",
  description: "Check if .prettierignore exists",
  tags: ["node", "recommended", "tool:prettier"],
  run: async (global, { hasIgnore }) => {
    if (!global.detected.hasPrettier) {
      return skip("prettier-ignore-exists", "Prettier not detected");
    }
    if (!hasIgnore) {
      return warn("prettier-ignore-exists", "No .prettierignore file");
    }
    return pass("prettier-ignore-exists", ".prettierignore exists");
  },
};

export const checks = [configExists, ignoreExists];
