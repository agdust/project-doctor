import { queryRules } from "../../eslint-db/index.js";
import type { RuleDefinition } from "../../eslint-db/types.js";
import type { Preset, PresetId, RuleValue } from "../types.js";

function rulesToConfig(
  rules: RuleDefinition[],
  value: RuleValue = "error",
): Record<string, RuleValue> {
  const result: Record<string, RuleValue> = {};
  for (const rule of rules) {
    result[rule.name] = value;
  }
  return result;
}

// Core rules excluded when using TypeScript (handled better by TS compiler or TS-ESLint)
const CORE_RULES_DISABLED_BY_TYPESCRIPT = [
  "no-undef", // TS handles this
  "no-unused-vars", // Use @typescript-eslint/no-unused-vars
  "no-redeclare", // Use @typescript-eslint/no-redeclare
  "no-use-before-define", // Use @typescript-eslint/no-use-before-define
  "no-shadow", // Use @typescript-eslint/no-shadow
  "no-empty-function", // Use @typescript-eslint/no-empty-function
  "no-useless-constructor", // Use @typescript-eslint/no-useless-constructor
  "no-dupe-class-members", // Use @typescript-eslint/no-dupe-class-members
  "no-invalid-this", // Use @typescript-eslint/no-invalid-this
  "no-loop-func", // Use @typescript-eslint/no-loop-func
  "no-loss-of-precision", // Use @typescript-eslint/no-loss-of-precision
  "no-magic-numbers", // Use @typescript-eslint/no-magic-numbers
  "require-await", // Use @typescript-eslint/require-await
  "no-return-await", // Use @typescript-eslint/return-await
  "no-throw-literal", // Use @typescript-eslint/only-throw-error
  "no-implied-eval", // Use @typescript-eslint/no-implied-eval
  "dot-notation", // Use @typescript-eslint/dot-notation
  "no-array-constructor", // Use @typescript-eslint/no-array-constructor
];

// Base preset: Essential error prevention for any JS project
const basePreset: Preset = {
  id: "base",
  name: "Base",
  description: "Essential error prevention and best practices",
  rules: rulesToConfig(
    queryRules({
      plugins: ["eslint"],
      maxStrictness: "recommended",
      includeTags: ["error-prevention", "best-practice"],
      taggedOnly: true,
    }),
  ),
};

// TypeScript preset: TS-specific rules, extends base
const typescriptPreset: Preset = {
  id: "typescript",
  name: "TypeScript",
  description: "TypeScript-specific rules, replaces core rules where appropriate",
  extends: ["base"],
  rules: rulesToConfig(
    queryRules({
      plugins: ["@typescript-eslint"],
      maxStrictness: "recommended",
      taggedOnly: true,
    }),
  ),
  disables: CORE_RULES_DISABLED_BY_TYPESCRIPT,
  requiresTypeChecking: false,
};

// Strict preset: Adds strict-level rules
const strictPreset: Preset = {
  id: "strict",
  name: "Strict",
  description: "Stricter than recommended, catches more issues",
  rules: rulesToConfig(
    queryRules({
      maxStrictness: "strict",
      excludeTags: ["essential", "recommended", "style"],
      taggedOnly: true,
    }),
  ),
  requiresTypeChecking: true, // Many strict rules need type info
};

// Style preset: Stylistic rules from @stylistic
const stylePreset: Preset = {
  id: "style",
  name: "Style",
  description: "Code formatting and stylistic consistency",
  rules: rulesToConfig(
    queryRules({
      plugins: ["@stylistic"],
      maxStrictness: "recommended",
      taggedOnly: true,
    }),
  ),
};

// Security preset: Security-focused rules
const securityPreset: Preset = {
  id: "security",
  name: "Security",
  description: "Security vulnerability prevention",
  rules: rulesToConfig(
    queryRules({
      includeTags: ["security"],
      taggedOnly: true,
    }),
  ),
};

// Performance preset: Performance-focused rules
const performancePreset: Preset = {
  id: "performance",
  name: "Performance",
  description: "Performance optimization rules",
  rules: rulesToConfig(
    queryRules({
      includeTags: ["performance"],
      taggedOnly: true,
    }),
  ),
};

// All presets registry
const presets: Record<PresetId, Preset> = {
  base: basePreset,
  typescript: typescriptPreset,
  strict: strictPreset,
  style: stylePreset,
  security: securityPreset,
  performance: performancePreset,
};

export function getPreset(id: PresetId): Preset {
  return presets[id];
}

export function getAllPresets(): Preset[] {
  return Object.values(presets);
}

export function getPresetIds(): PresetId[] {
  return Object.keys(presets) as PresetId[];
}

export function isValidPresetId(id: string): id is PresetId {
  return id in presets;
}
