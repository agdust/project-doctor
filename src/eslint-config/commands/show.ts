import { bold, dim, green, yellow, cyan } from "../../utils/colors.js";
import { getAllPresets } from "../presets/presets.js";
import { getStats } from "../../eslint-db/index.js";
import { readExistingConfig } from "../reader/reader.js";

export interface ShowOptions {
  presets?: boolean;
  rules?: boolean;
}

export async function runEslintShow(projectPath: string, options: ShowOptions): Promise<void> {
  if (options.presets === true) {
    showPresets();
    return;
  }

  if (options.rules === true) {
    showRuleStats();
    return;
  }

  // Default: show current config status
  await showCurrentConfig(projectPath);
}

function showPresets(): void {
  console.log();
  console.log(bold("Available Presets:"));
  console.log();

  for (const preset of getAllPresets()) {
    console.log(`  ${cyan(preset.id)}`);
    console.log(`    ${preset.description}`);
    if (preset.extends !== undefined && preset.extends.length > 0) {
      console.log(`    ${dim(`Extends: ${preset.extends.join(", ")}`)}`);
    }
    const ruleCount = Object.keys(preset.rules).length;
    console.log(`    ${dim(`${ruleCount} rules`)}`);
    console.log();
  }
}

function showRuleStats(): void {
  const stats = getStats();

  console.log();
  console.log(bold("Rule Database Statistics:"));
  console.log();
  console.log(`  Total rules: ${bold(String(stats.totalRules))}`);
  console.log(`  Tagged rules: ${stats.taggedRules}`);
  console.log(`  Fixable: ${stats.fixableRules}`);
  console.log(`  Deprecated: ${stats.deprecatedRules}`);
  console.log(`  Require type-checking: ${stats.typeCheckingRules}`);
  console.log();
  console.log(`  ${bold("By plugin:")}`);
  for (const [plugin, count] of Object.entries(stats.rulesByPlugin)) {
    const shortName = plugin.replace("/eslint-plugin", "");
    console.log(`    ${shortName}: ${count}`);
  }
  console.log();
  console.log(`  ${bold("By strictness:")}`);
  console.log(`    Essential: ${stats.rulesByStrictness.essential}`);
  console.log(`    Recommended: ${stats.rulesByStrictness.recommended}`);
  console.log(`    Strict: ${stats.rulesByStrictness.strict}`);
  console.log(`    Pedantic: ${stats.rulesByStrictness.pedantic}`);
  console.log();
}

async function showCurrentConfig(projectPath: string): Promise<void> {
  const existing = await readExistingConfig(projectPath);

  console.log();

  if (!existing) {
    console.log(`  ${yellow("!")} No ESLint config found`);
    console.log();
    console.log(`  Run ${cyan("project-doctor eslint init")} to create one`);
    console.log();
    return;
  }

  console.log(bold("Current ESLint Config:"));
  console.log();
  console.log(`  File: ${dim(existing.filePath)}`);
  console.log(`  Rules: ${bold(String(Object.keys(existing.rules).length))}`);
  console.log(`  Type-checking: ${existing.hasTypeChecking ? green("yes") : dim("no")}`);
  console.log();
}
