// ESLint Database Types
// Thin wrapper - adds custom categorization on top of plugin metadata

// =============================================================================
// Tag Types (our value-add on top of plugin metadata)
// =============================================================================

// Concern tags - what the rule addresses
export type RuleConcern =
  | "error-prevention" // Catches bugs and runtime errors
  | "security" // Security vulnerabilities
  | "performance" // Performance issues
  | "style" // Code style and formatting
  | "a11y" // Accessibility
  | "best-practice" // General best practices
  | "maintainability" // Code maintainability and readability
  | "type-safety"; // Type-related checks

// Strictness tags - how strict/opinionated the rule is
export type RuleStrictness =
  | "essential" // Must have, catches real bugs
  | "recommended" // Widely accepted best practice
  | "strict" // Stricter than recommended
  | "pedantic"; // Very strict, may be controversial

export type RuleTag = RuleConcern | RuleStrictness;

// Strictness ordering for comparisons
export const STRICTNESS_ORDER: Record<RuleStrictness, number> = {
  essential: 1,
  recommended: 2,
  strict: 3,
  pedantic: 4,
};

// =============================================================================
// Rule Tags Registry
// =============================================================================

// Maps rule names to our custom tags
// Rules not in this map can still be used, they just won't have our categorization
export type RuleTagsMap = Record<string, RuleTag[]>;

// =============================================================================
// Rule Definition (built from plugin metadata + our tags)
// =============================================================================

export interface RuleDefinition {
  name: string; // Full rule name (e.g., "@typescript-eslint/no-explicit-any")
  description: string;
  tags: RuleTag[]; // Our custom tags
  fixable: boolean;
  deprecated: boolean;
  requiresTypeChecking?: boolean;
  docs?: string; // URL to documentation
  plugin: string; // Plugin name
}

// =============================================================================
// Plugin Definition
// =============================================================================

export interface PluginDefinition {
  name: string; // npm package name
  prefix: string; // Rule prefix (e.g., "@typescript-eslint", "" for core)
  ruleCount: number;
}

// =============================================================================
// Query Types
// =============================================================================

export interface RuleQuery {
  // Filter by plugin prefix
  plugins?: string[];

  // Include rules with ANY of these tags
  includeTags?: RuleTag[];

  // Exclude rules with ANY of these tags
  excludeTags?: RuleTag[];

  // Only include rules with this strictness or lower
  maxStrictness?: RuleStrictness;

  // Include deprecated rules (default: false)
  includeDeprecated?: boolean;

  // Only include fixable rules
  fixableOnly?: boolean;

  // Only include rules that have our tags
  taggedOnly?: boolean;
}
