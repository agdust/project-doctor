import type { BuildConfig, GeneratedConfig, ResolvedRule, PresetId } from "../types.js";
import { getPreset } from "../presets/presets.js";
import { generateComment } from "./comments.js";

export function buildConfig(config: BuildConfig): GeneratedConfig {
  const expandedPresets = expandPresets(config.presets);
  const rules = new Map<string, ResolvedRule>();
  const plugins = new Set<string>();
  let requiresTypeChecking = false;

  // Apply presets in order (later presets override earlier)
  for (const presetId of expandedPresets) {
    const preset = getPreset(presetId);

    // Add rules from preset
    for (const [name, value] of Object.entries(preset.rules)) {
      rules.set(name, {
        name,
        value,
        comment: generateComment(name),
        source: presetId,
      });
    }

    // Handle disables - turn off rules from base presets
    for (const disabled of preset.disables ?? []) {
      rules.set(disabled, {
        name: disabled,
        value: "off",
        comment: `Disabled by ${presetId} preset`,
        source: presetId,
      });
    }

    // Track type-checking requirement
    if (preset.requiresTypeChecking) {
      requiresTypeChecking = true;
    }

    // Track plugins
    plugins.add(getPluginForPreset(presetId));
  }

  // Apply user overrides
  for (const [name, value] of Object.entries(config.overrides ?? {})) {
    rules.set(name, {
      name,
      value,
      comment: "Custom override",
      source: config.presets[0] ?? "base",
    });
  }

  // Apply user disables
  for (const name of config.disabled ?? []) {
    rules.delete(name);
  }

  // Remove rules that are "off"
  const finalRules = Array.from(rules.values()).filter((r) => r.value !== "off");

  return {
    rules: sortRules(finalRules),
    plugins: Array.from(plugins).filter(Boolean),
    requiresTypeChecking,
    presets: config.presets,
  };
}

function expandPresets(presets: PresetId[]): PresetId[] {
  const expanded: PresetId[] = [];
  const seen = new Set<PresetId>();

  function visit(id: PresetId): void {
    if (seen.has(id)) return;
    seen.add(id);

    const preset = getPreset(id);
    for (const dep of preset.extends ?? []) {
      visit(dep);
    }
    expanded.push(id);
  }

  for (const id of presets) {
    visit(id);
  }

  return expanded;
}

function getPluginForPreset(presetId: PresetId): string {
  switch (presetId) {
    case "typescript":
    case "strict":
      return "@typescript-eslint";
    case "style":
      return "@stylistic";
    default:
      return "";
  }
}

function sortRules(rules: ResolvedRule[]): ResolvedRule[] {
  return rules.sort((a, b) => {
    const aPrefix = getPrefix(a.name);
    const bPrefix = getPrefix(b.name);
    if (aPrefix !== bPrefix) {
      return prefixOrder(aPrefix) - prefixOrder(bPrefix);
    }
    return a.name.localeCompare(b.name);
  });
}

function getPrefix(name: string): string {
  if (name.startsWith("@typescript-eslint/")) return "@typescript-eslint";
  if (name.startsWith("@stylistic/")) return "@stylistic";
  return "";
}

function prefixOrder(prefix: string): number {
  if (prefix === "") return 0;
  if (prefix === "@typescript-eslint") return 1;
  if (prefix === "@stylistic") return 2;
  return 3;
}
