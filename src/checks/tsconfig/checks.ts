import type { Check, CheckResult } from "../../types.ts";
import type { TsConfigContext } from "./context.ts";

function skip(name: string, message: string): CheckResult {
  return { name, status: "skip", message };
}

function pass(name: string, message: string): CheckResult {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResult {
  return { name, status: "fail", message };
}

export const exists: Check<TsConfigContext> = {
  name: "tsconfig-exists",
  description: "Check if tsconfig.json exists",
  tags: ["typescript", "required"],
  run: async (_global, { raw }) => {
    if (!raw) return fail("tsconfig-exists", "tsconfig.json not found");
    return pass("tsconfig-exists", "tsconfig.json exists");
  },
};

export const validJson: Check<TsConfigContext> = {
  name: "tsconfig-valid-json",
  description: "Check if tsconfig.json is valid JSON",
  tags: ["typescript", "required"],
  run: async (_global, { raw, parseError }) => {
    if (!raw) return skip("tsconfig-valid-json", "No tsconfig.json");
    if (parseError) return fail("tsconfig-valid-json", `Invalid JSON: ${parseError}`);
    return pass("tsconfig-valid-json", "Valid JSON");
  },
};

export const strictEnabled: Check<TsConfigContext> = {
  name: "tsconfig-strict-enabled",
  description: "Check if TypeScript strict mode is enabled",
  tags: ["typescript", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("tsconfig-strict-enabled", "No tsconfig.json");
    if (!parsed.compilerOptions?.strict) {
      return fail("tsconfig-strict-enabled", "strict mode not enabled");
    }
    return pass("tsconfig-strict-enabled", "strict mode enabled");
  },
};

export const hasOutDir: Check<TsConfigContext> = {
  name: "tsconfig-has-outdir",
  description: "Check if tsconfig.json has outDir configured",
  tags: ["typescript", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("tsconfig-has-outdir", "No tsconfig.json");
    if (!parsed.compilerOptions?.outDir) {
      return fail("tsconfig-has-outdir", "No outDir configured");
    }
    return pass("tsconfig-has-outdir", `outDir: ${parsed.compilerOptions.outDir}`);
  },
};

export const noAnyEnabled: Check<TsConfigContext> = {
  name: "tsconfig-no-any-enabled",
  description: "Check if noImplicitAny is enabled",
  tags: ["typescript", "opinionated"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("tsconfig-no-any-enabled", "No tsconfig.json");
    const opts = parsed.compilerOptions;
    if (!opts?.strict && !opts?.noImplicitAny) {
      return fail("tsconfig-no-any-enabled", "noImplicitAny not enabled");
    }
    return pass("tsconfig-no-any-enabled", "noImplicitAny enabled");
  },
};

export const pathsValid: Check<TsConfigContext> = {
  name: "tsconfig-paths-valid",
  description: "Check if path aliases have baseUrl configured",
  tags: ["typescript", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("tsconfig-paths-valid", "No tsconfig.json");
    const opts = parsed.compilerOptions;
    if (opts?.paths && !opts?.baseUrl) {
      return fail("tsconfig-paths-valid", "paths defined but no baseUrl");
    }
    return pass("tsconfig-paths-valid", "Path config valid");
  },
};

export const checks = [
  exists,
  validJson,
  strictEnabled,
  hasOutDir,
  noAnyEnabled,
  pathsValid,
];
