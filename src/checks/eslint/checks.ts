import type { Check, CheckResultBase } from "../../types.js";
import type { EslintContext } from "./context.js";

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

export const configExists: Check<EslintContext> = {
  name: "eslint-config-exists",
  description: "Check if ESLint configuration exists",
  tags: ["node", "recommended", "tool:eslint"],
  run: async (global, { hasFlatConfig, hasLegacyConfig }) => {
    if (!global.detected.hasEslint) {
      return skip("eslint-config-exists", "ESLint not detected");
    }
    if (!hasFlatConfig && !hasLegacyConfig) {
      return fail("eslint-config-exists", "No ESLint config found");
    }
    return pass("eslint-config-exists", "ESLint configured");
  },
};

export const flatConfig: Check<EslintContext> = {
  name: "eslint-flat-config",
  description: "Check if using ESLint flat config format (v9+)",
  tags: ["node", "recommended", "tool:eslint"],
  run: async (global, { hasFlatConfig, flatConfigFile }) => {
    if (!global.detected.hasEslint) {
      return skip("eslint-flat-config", "ESLint not detected");
    }
    if (!hasFlatConfig) {
      return fail("eslint-flat-config", "Not using flat config (eslint.config.{js,mjs,ts})");
    }
    return pass("eslint-flat-config", `Using flat config: ${flatConfigFile}`);
  },
};

export const noLegacyConfig: Check<EslintContext> = {
  name: "eslint-no-legacy-config",
  description: "Check that no legacy .eslintrc files exist",
  tags: ["node", "recommended", "tool:eslint"],
  run: async (global, { hasLegacyConfig }) => {
    if (!global.detected.hasEslint) {
      return skip("eslint-no-legacy-config", "ESLint not detected");
    }
    if (hasLegacyConfig) {
      return warn("eslint-no-legacy-config", "Legacy .eslintrc config found");
    }
    return pass("eslint-no-legacy-config", "No legacy config");
  },
};

export const checks = [configExists, flatConfig, noLegacyConfig];
