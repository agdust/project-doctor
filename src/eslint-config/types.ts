import type { RuleStrictness, RuleConcern } from "../eslint-db/types.js";

// Preset identifier
export type PresetId =
  | "base" // Essential JS rules
  | "typescript" // TypeScript-specific rules
  | "strict" // Stricter than recommended
  | "style" // Stylistic rules (@stylistic plugin)
  | "security" // Security-focused rules
  | "performance"; // Performance rules

// Rule value in ESLint config
export type RuleValue = "off" | "warn" | "error" | ["error" | "warn", ...unknown[]];

// A resolved rule with value and metadata
export interface ResolvedRule {
  name: string;
  value: RuleValue;
  comment: string;
  source: PresetId;
}

// Preset definition
export interface Preset {
  id: PresetId;
  name: string;
  description: string;
  extends?: PresetId[];
  rules: Record<string, RuleValue>;
  disables?: string[];
  requiresTypeChecking?: boolean;
}

// User selections from wizard
export interface WizardSelections {
  presets: PresetId[];
  strictness: RuleStrictness;
  concerns: RuleConcern[];
  typeChecking: boolean;
}

// Build configuration
export interface BuildConfig {
  presets: PresetId[];
  overrides?: Record<string, RuleValue>;
  disabled?: string[];
}

// Generated config output
export interface GeneratedConfig {
  rules: ResolvedRule[];
  plugins: string[];
  requiresTypeChecking: boolean;
  presets: PresetId[];
}

// Diff entry
export interface DiffEntry {
  rule: string;
  current: RuleValue | undefined;
  proposed: RuleValue;
  action: "add" | "remove" | "change";
}

// Config diff result
export interface ConfigDiff {
  entries: DiffEntry[];
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
}

// Parsed existing config
export interface ParsedConfig {
  rules: Record<string, RuleValue>;
  hasTypeChecking: boolean;
  filePath: string;
}
