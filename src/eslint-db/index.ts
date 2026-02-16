// ESLint Database
// Thin wrapper that combines plugin metadata with our custom tags

import { builtinRules } from "eslint/use-at-your-own-risk";
import tseslintModule from "typescript-eslint";
import stylisticModule from "@stylistic/eslint-plugin";

// TypeScript types don't fully expose plugin internals, access via any
const tseslintPlugin = (tseslintModule as { plugin?: { rules?: Record<string, unknown> } }).plugin;
const stylisticPlugin = stylisticModule as { rules?: Record<string, unknown> };

import type {
  PluginDefinition,
  RuleDefinition,
  RuleTag,
  RuleStrictness,
  RuleQuery,
} from "./types.js";
import { STRICTNESS_ORDER } from "./types.js";
import { ruleTags } from "./tags.js";

// =============================================================================
// Plugin Definitions
// =============================================================================

interface RawRuleMeta {
  meta?: {
    docs?: {
      description?: string;
      url?: string;
      requiresTypeChecking?: boolean;
    };
    fixable?: string;
    deprecated?: boolean | object;
  };
}

type RawRules = Map<string, RawRuleMeta> | Record<string, RawRuleMeta>;

function buildRules(rawRules: RawRules, prefix: string, pluginName: string): RuleDefinition[] {
  const entries = rawRules instanceof Map ? rawRules.entries() : Object.entries(rawRules);

  const rules: RuleDefinition[] = [];

  for (const [shortName, rule] of entries) {
    const fullName = prefix ? `${prefix}/${shortName}` : shortName;
    const meta = rule?.meta;
    const tags = ruleTags[fullName] ?? [];

    rules.push({
      name: fullName,
      description: meta?.docs?.description ?? "",
      tags,
      fixable: Boolean(meta?.fixable),
      deprecated: Boolean(meta?.deprecated),
      requiresTypeChecking: meta?.docs?.requiresTypeChecking,
      docs: meta?.docs?.url,
      plugin: pluginName,
    });
  }

  return rules;
}

// Build rules from actual plugins
// eslint-disable-next-line @typescript-eslint/no-deprecated -- intentional use of internal API
const coreRules = buildRules(builtinRules, "", "eslint");
const tsRules = buildRules(
  (tseslintPlugin?.rules ?? {}) as Record<string, RawRuleMeta>,
  "@typescript-eslint",
  "@typescript-eslint/eslint-plugin",
);
const stylisticRules = buildRules(
  (stylisticPlugin.rules ?? {}) as Record<string, RawRuleMeta>,
  "@stylistic",
  "@stylistic/eslint-plugin",
);

const allRules: RuleDefinition[] = [...coreRules, ...tsRules, ...stylisticRules];

const plugins: PluginDefinition[] = [
  { name: "eslint", prefix: "", ruleCount: coreRules.length },
  {
    name: "@typescript-eslint/eslint-plugin",
    prefix: "@typescript-eslint",
    ruleCount: tsRules.length,
  },
  {
    name: "@stylistic/eslint-plugin",
    prefix: "@stylistic",
    ruleCount: stylisticRules.length,
  },
];

// =============================================================================
// Plugin Queries
// =============================================================================

export function getAllPlugins(): PluginDefinition[] {
  return plugins;
}

export function getPluginByName(name: string): PluginDefinition | undefined {
  return plugins.find((p) => p.name === name || p.prefix === name);
}

export function getPluginByPrefix(prefix: string): PluginDefinition | undefined {
  return plugins.find((p) => p.prefix === prefix);
}

// =============================================================================
// Rule Queries
// =============================================================================

export function getAllRules(): RuleDefinition[] {
  return allRules;
}

export function getRulesFromPlugin(pluginName: string): RuleDefinition[] {
  const plugin = getPluginByName(pluginName);
  if (!plugin) return [];
  return allRules.filter((r) => r.plugin === plugin.name);
}

export function getRuleByName(name: string): RuleDefinition | undefined {
  return allRules.find((r) => r.name === name);
}

export function getRulesByTags(includeTags: RuleTag[], matchAll = false): RuleDefinition[] {
  return allRules.filter((rule) => {
    if (matchAll) {
      return includeTags.every((tag) => rule.tags.includes(tag));
    }
    return includeTags.some((tag) => rule.tags.includes(tag));
  });
}

export function getRulesExcludingTags(excludeTags: RuleTag[]): RuleDefinition[] {
  return allRules.filter((rule) => {
    return !excludeTags.some((tag) => rule.tags.includes(tag));
  });
}

export function getRulesByStrictness(maxStrictness: RuleStrictness): RuleDefinition[] {
  const maxOrder = STRICTNESS_ORDER[maxStrictness];
  return allRules.filter((rule) => {
    const ruleStrictness = rule.tags.find((t): t is RuleStrictness => t in STRICTNESS_ORDER);
    if (!ruleStrictness) return false; // Exclude rules without strictness tag
    return STRICTNESS_ORDER[ruleStrictness] <= maxOrder;
  });
}

export function getFixableRules(): RuleDefinition[] {
  return allRules.filter((r) => r.fixable);
}

export function getTypeCheckingRules(): RuleDefinition[] {
  return allRules.filter((r) => r.requiresTypeChecking);
}

export function getNonDeprecatedRules(): RuleDefinition[] {
  return allRules.filter((r) => !r.deprecated);
}

export function getTaggedRules(): RuleDefinition[] {
  return allRules.filter((r) => r.tags.length > 0);
}

// =============================================================================
// Advanced Queries
// =============================================================================

export function queryRules(query: RuleQuery): RuleDefinition[] {
  let rules = allRules;

  // Filter by plugin
  if (query.plugins?.length) {
    const pluginPrefixes = query.plugins.map((name) => {
      const plugin = getPluginByName(name);
      return plugin?.prefix ?? name;
    });
    rules = rules.filter((rule) => {
      return pluginPrefixes.some((prefix) => {
        if (prefix === "") {
          return !rule.name.includes("/");
        }
        return rule.name.startsWith(prefix + "/");
      });
    });
  }

  // Filter by include tags
  if (query.includeTags?.length) {
    rules = rules.filter((rule) => query.includeTags?.some((tag) => rule.tags.includes(tag)));
  }

  // Filter by exclude tags
  if (query.excludeTags?.length) {
    rules = rules.filter((rule) => !query.excludeTags?.some((tag) => rule.tags.includes(tag)));
  }

  // Filter by max strictness
  if (query.maxStrictness) {
    const maxOrder = STRICTNESS_ORDER[query.maxStrictness];
    rules = rules.filter((rule) => {
      const ruleStrictness = rule.tags.find((t): t is RuleStrictness => t in STRICTNESS_ORDER);
      if (!ruleStrictness) return false;
      return STRICTNESS_ORDER[ruleStrictness] <= maxOrder;
    });
  }

  // Filter deprecated
  if (!query.includeDeprecated) {
    rules = rules.filter((r) => !r.deprecated);
  }

  // Filter fixable only
  if (query.fixableOnly) {
    rules = rules.filter((r) => r.fixable);
  }

  // Filter tagged only
  if (query.taggedOnly) {
    rules = rules.filter((r) => r.tags.length > 0);
  }

  return rules;
}

// =============================================================================
// Utilities
// =============================================================================

export function groupRulesByPlugin(rules: RuleDefinition[]): Map<string, RuleDefinition[]> {
  const grouped = new Map<string, RuleDefinition[]>();

  for (const rule of rules) {
    const existing = grouped.get(rule.plugin) ?? [];
    existing.push(rule);
    grouped.set(rule.plugin, existing);
  }

  return grouped;
}

export function getRuleStrictness(rule: RuleDefinition): RuleStrictness | null {
  return rule.tags.find((t): t is RuleStrictness => t in STRICTNESS_ORDER) ?? null;
}

// =============================================================================
// Statistics
// =============================================================================

export function getStats(): {
  totalPlugins: number;
  totalRules: number;
  taggedRules: number;
  rulesByPlugin: Record<string, number>;
  rulesByStrictness: Record<RuleStrictness, number>;
  fixableRules: number;
  deprecatedRules: number;
  typeCheckingRules: number;
} {
  const grouped = groupRulesByPlugin(allRules);

  const rulesByPlugin: Record<string, number> = {};
  for (const [name, rules] of grouped) {
    rulesByPlugin[name] = rules.length;
  }

  const rulesByStrictness: Record<RuleStrictness, number> = {
    essential: 0,
    recommended: 0,
    strict: 0,
    pedantic: 0,
  };

  for (const rule of allRules) {
    const strictness = getRuleStrictness(rule);
    if (strictness) {
      rulesByStrictness[strictness]++;
    }
  }

  return {
    totalPlugins: plugins.length,
    totalRules: allRules.length,
    taggedRules: allRules.filter((r) => r.tags.length > 0).length,
    rulesByPlugin,
    rulesByStrictness,
    fixableRules: allRules.filter((r) => r.fixable).length,
    deprecatedRules: allRules.filter((r) => r.deprecated).length,
    typeCheckingRules: allRules.filter((r) => r.requiresTypeChecking).length,
  };
}

// =============================================================================
// Re-exports
// =============================================================================

export type {
  PluginDefinition,
  RuleDefinition,
  RuleTag,
  RuleConcern,
  RuleStrictness,
  RuleQuery,
} from "./types.js";

export { STRICTNESS_ORDER } from "./types.js";
export { ruleTags } from "./tags.js";
