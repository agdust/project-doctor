import { getAllPresets } from "../presets/presets.js";
import { getStats } from "../../eslint-db/index.js";
import { readExistingConfig } from "../reader/reader.js";

export type ShowOptions = {
  presets?: boolean;
  rules?: boolean;
};

export async function runEslintShow(projectPath: string, options: ShowOptions): Promise<void> {
  if (options.presets) {
    showPresets();
    return;
  }

  if (options.rules) {
    showRuleStats();
    return;
  }

  // Default: show current config status
  await showCurrentConfig(projectPath);
}

function showPresets(): void {
  console.log();
  console.log("\x1b[1mAvailable Presets:\x1b[0m");
  console.log();

  for (const preset of getAllPresets()) {
    console.log(`  \x1b[36m${preset.id}\x1b[0m`);
    console.log(`    ${preset.description}`);
    if (preset.extends?.length) {
      console.log(`    \x1b[90mExtends: ${preset.extends.join(", ")}\x1b[0m`);
    }
    const ruleCount = Object.keys(preset.rules).length;
    console.log(`    \x1b[90m${ruleCount} rules\x1b[0m`);
    console.log();
  }
}

function showRuleStats(): void {
  const stats = getStats();

  console.log();
  console.log("\x1b[1mRule Database Statistics:\x1b[0m");
  console.log();
  console.log(`  Total rules: \x1b[1m${stats.totalRules}\x1b[0m`);
  console.log(`  Tagged rules: ${stats.taggedRules}`);
  console.log(`  Fixable: ${stats.fixableRules}`);
  console.log(`  Deprecated: ${stats.deprecatedRules}`);
  console.log(`  Require type-checking: ${stats.typeCheckingRules}`);
  console.log();
  console.log("  \x1b[1mBy plugin:\x1b[0m");
  for (const [plugin, count] of Object.entries(stats.rulesByPlugin)) {
    const shortName = plugin.replace("/eslint-plugin", "");
    console.log(`    ${shortName}: ${count}`);
  }
  console.log();
  console.log("  \x1b[1mBy strictness:\x1b[0m");
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
    console.log("  \x1b[33m!\x1b[0m No ESLint config found");
    console.log();
    console.log("  Run \x1b[36mproject-doctor eslint init\x1b[0m to create one");
    console.log();
    return;
  }

  console.log("\x1b[1mCurrent ESLint Config:\x1b[0m");
  console.log();
  console.log(`  File: \x1b[90m${existing.filePath}\x1b[0m`);
  console.log(`  Rules: \x1b[1m${Object.keys(existing.rules).length}\x1b[0m`);
  console.log(`  Type-checking: ${existing.hasTypeChecking ? "\x1b[32myes\x1b[0m" : "\x1b[90mno\x1b[0m"}`);
  console.log();
}
