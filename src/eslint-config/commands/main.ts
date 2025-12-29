import { select, confirm } from "@inquirer/prompts";
import { readExistingConfig } from "../reader/reader.js";
import { buildConfig } from "../builder/builder.js";
import { generateConfigFile } from "../generator/generator.js";
import { computeDiff } from "../differ/differ.js";
import { formatDiff } from "../differ/formatter.js";
import { runWizard, confirmApply, selectPresets } from "../wizard/wizard.js";
import type { ParsedConfig, PresetId } from "../types.js";
import { getAllPresets, getPreset, isValidPresetId } from "../presets/presets.js";
import { getStats } from "../../eslint-db/index.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

type MainAction =
  | "init-wizard"
  | "init-quick"
  | "analyze"
  | "add-preset"
  | "show-diff"
  | "show-presets"
  | "show-rules"
  | "show-current"
  | "exit";

export async function runMainWizard(projectPath: string): Promise<void> {
  clearScreen();
  printHeader();

  // Main application loop
  while (true) {
    const existing = await readExistingConfig(projectPath);
    const shouldExit = await runMainMenu(projectPath, existing);

    if (shouldExit) {
      console.log("  \x1b[90mGoodbye!\x1b[0m");
      console.log();
      break;
    }

    // Wait for user to press enter before showing menu again
    await pressEnterToContinue();
    clearScreen();
    printHeader();
  }
}

function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

function printHeader(): void {
  console.log();
  console.log("\x1b[1m\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m\x1b[36m║\x1b[0m  \x1b[1mESLint Configuration Builder\x1b[0m                              \x1b[1m\x1b[36m║\x1b[0m");
  console.log("\x1b[1m\x1b[36m║\x1b[0m  \x1b[90mBuild and manage your ESLint config interactively\x1b[0m         \x1b[1m\x1b[36m║\x1b[0m");
  console.log("\x1b[1m\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m");
  console.log();
}

function printSectionHeader(title: string): void {
  console.log();
  console.log(`\x1b[1m── ${title} ${"─".repeat(55 - title.length)}\x1b[0m`);
  console.log();
}

async function pressEnterToContinue(): Promise<void> {
  console.log();
  console.log("  \x1b[90mPress Enter to continue...\x1b[0m");

  return new Promise((resolve) => {
    const onData = (): void => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode?.(false);
      process.stdin.pause();
      resolve();
    };

    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.once("data", onData);
  });
}

async function runMainMenu(projectPath: string, existing: ParsedConfig | null): Promise<boolean> {
  // Show current status
  if (existing) {
    const ruleCount = Object.keys(existing.rules).length;
    const typeCheckingStatus = existing.hasTypeChecking ? "\x1b[32menabled\x1b[0m" : "\x1b[90mdisabled\x1b[0m";
    console.log(`  \x1b[32m✓\x1b[0m Config: \x1b[36m${existing.filePath}\x1b[0m`);
    console.log(`    ${ruleCount} rules, type-checking ${typeCheckingStatus}`);
  } else {
    console.log("  \x1b[33m!\x1b[0m No ESLint config found in this project");
  }
  console.log();

  const choices = existing
    ? [
        { name: "📊 Analyze config", value: "analyze" as MainAction, description: "Compare against recommended rules" },
        { name: "➕ Add a preset", value: "add-preset" as MainAction, description: "Add security, performance, strict rules" },
        { name: "📋 Show diff", value: "show-diff" as MainAction, description: "See differences from recommended" },
        { name: "🔄 Regenerate config", value: "init-wizard" as MainAction, description: "Start fresh with wizard" },
        { name: "📦 View presets", value: "show-presets" as MainAction, description: "List available presets" },
        { name: "📚 View rule stats", value: "show-rules" as MainAction, description: "Database statistics" },
        { name: "📄 Show current config", value: "show-current" as MainAction, description: "Display parsed rules" },
        { name: "🚪 Exit", value: "exit" as MainAction },
      ]
    : [
        { name: "🧙 Create config (wizard)", value: "init-wizard" as MainAction, description: "Interactive guided setup" },
        { name: "⚡ Create config (quick)", value: "init-quick" as MainAction, description: "Use recommended defaults" },
        { name: "📦 View presets", value: "show-presets" as MainAction, description: "See what's available" },
        { name: "📚 View rule stats", value: "show-rules" as MainAction, description: "Database statistics" },
        { name: "🚪 Exit", value: "exit" as MainAction },
      ];

  const action = await select<MainAction>({
    message: "What would you like to do?",
    choices,
  });

  if (action === "exit") {
    return true;
  }

  await executeAction(projectPath, action, existing);
  return false;
}

async function executeAction(
  projectPath: string,
  action: MainAction,
  existing: ParsedConfig | null
): Promise<void> {
  switch (action) {
    case "init-wizard":
      await handleInitWizard(projectPath, existing);
      break;
    case "init-quick":
      await handleInitQuick(projectPath);
      break;
    case "analyze":
      await handleAnalyze(existing);
      break;
    case "add-preset":
      await handleAddPreset(projectPath, existing);
      break;
    case "show-diff":
      await handleShowDiff(existing);
      break;
    case "show-presets":
      handleShowPresets();
      break;
    case "show-rules":
      handleShowRules();
      break;
    case "show-current":
      handleShowCurrent(existing);
      break;
  }
}

async function handleInitWizard(projectPath: string, existing: ParsedConfig | null): Promise<void> {
  printSectionHeader("Configuration Wizard");

  if (existing) {
    const overwrite = await confirm({
      message: "This will replace your existing config. Continue?",
      default: false,
    });
    if (!overwrite) {
      console.log("  \x1b[90mCancelled\x1b[0m");
      return;
    }
  }

  const selections = await runWizard();
  const config = buildConfig({ presets: selections.presets });
  const fileContent = generateConfigFile(config);

  console.log();
  console.log(`  Presets: \x1b[36m${selections.presets.join(", ")}\x1b[0m`);
  console.log(`  Rules: \x1b[1m${config.rules.length}\x1b[0m`);
  console.log();

  const apply = await confirmApply();
  if (!apply) {
    console.log("  \x1b[90mCancelled\x1b[0m");
    return;
  }

  const configPath = join(projectPath, "eslint.config.js");
  await writeFile(configPath, fileContent, "utf-8");
  console.log(`  \x1b[32m✓\x1b[0m Created eslint.config.js`);
}

async function handleInitQuick(projectPath: string): Promise<void> {
  printSectionHeader("Quick Setup");

  const presets: PresetId[] = ["base", "typescript"];
  const config = buildConfig({ presets });
  const fileContent = generateConfigFile(config);

  console.log(`  Using presets: \x1b[36m${presets.join(", ")}\x1b[0m`);
  console.log(`  Rules: \x1b[1m${config.rules.length}\x1b[0m`);
  console.log();

  const apply = await confirmApply();
  if (!apply) {
    console.log("  \x1b[90mCancelled\x1b[0m");
    return;
  }

  const configPath = join(projectPath, "eslint.config.js");
  await writeFile(configPath, fileContent, "utf-8");
  console.log(`  \x1b[32m✓\x1b[0m Created eslint.config.js`);
}

async function handleAnalyze(existing: ParsedConfig | null): Promise<void> {
  printSectionHeader("Config Analysis");

  if (!existing) {
    console.log("  \x1b[31mNo config to analyze\x1b[0m");
    return;
  }

  const ruleCount = Object.keys(existing.rules).length;
  const presets = getAllPresets();

  console.log(`  Your config has \x1b[1m${ruleCount}\x1b[0m rules configured`);
  console.log();
  console.log("  \x1b[1mCoverage by preset:\x1b[0m");
  console.log();

  for (const preset of presets) {
    const presetRuleNames = Object.keys(preset.rules);
    const covered = presetRuleNames.filter((name) => name in existing.rules);
    const percentage =
      presetRuleNames.length > 0 ? Math.round((covered.length / presetRuleNames.length) * 100) : 0;

    const bar = renderProgressBar(percentage);
    const color = percentage >= 80 ? "\x1b[32m" : percentage >= 50 ? "\x1b[33m" : "\x1b[31m";

    console.log(
      `  ${preset.id.padEnd(12)} ${bar} ${color}${String(percentage).padStart(3)}%\x1b[0m  (${covered.length}/${presetRuleNames.length} rules)`
    );
  }
}

function renderProgressBar(percentage: number): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `\x1b[90m[\x1b[0m${"█".repeat(filled)}\x1b[90m${"░".repeat(empty)}]\x1b[0m`;
}

async function handleAddPreset(projectPath: string, existing: ParsedConfig | null): Promise<void> {
  printSectionHeader("Add Preset");

  if (!existing) {
    console.log("  \x1b[31mNo config found. Create one first.\x1b[0m");
    return;
  }

  const allPresets = getAllPresets();
  const currentRules = Object.keys(existing.rules);

  const presetChoices = allPresets
    .filter((p) => p.id !== "base")
    .map((preset) => {
      const presetRuleNames = Object.keys(preset.rules);
      const covered = presetRuleNames.filter((name) => currentRules.includes(name));
      const percentage =
        presetRuleNames.length > 0 ? Math.round((covered.length / presetRuleNames.length) * 100) : 0;

      let badge = "";
      if (percentage === 100) {
        badge = " \x1b[32m✓ complete\x1b[0m";
      } else if (percentage > 0) {
        badge = ` \x1b[33m${percentage}%\x1b[0m`;
      }

      return {
        name: `${preset.name}${badge}`,
        value: preset.id,
        description: preset.description,
      };
    });

  presetChoices.push({
    name: "\x1b[90m← Back\x1b[0m",
    value: "back" as PresetId,
    description: "Return to main menu",
  });

  const presetId = await select<PresetId | "back">({
    message: "Which preset to add?",
    choices: presetChoices,
  });

  if (presetId === "back") {
    return;
  }

  const preset = getPreset(presetId);
  const selectedPresets: PresetId[] = ["base", "typescript", presetId];
  const newConfig = buildConfig({ presets: selectedPresets });

  const diff = computeDiff(existing.rules, newConfig.rules);
  console.log();
  console.log(formatDiff(diff));

  if (diff.entries.length === 0) {
    console.log("  \x1b[32m✓\x1b[0m Preset rules already present");
    return;
  }

  const apply = await confirmApply();
  if (!apply) {
    console.log("  \x1b[90mCancelled\x1b[0m");
    return;
  }

  const fileContent = generateConfigFile(newConfig);
  await writeFile(existing.filePath, fileContent, "utf-8");
  console.log(`  \x1b[32m✓\x1b[0m Updated config with ${preset.name} preset`);
}

async function handleShowDiff(existing: ParsedConfig | null): Promise<void> {
  printSectionHeader("Diff vs Recommended");

  if (!existing) {
    console.log("  \x1b[31mNo config to compare\x1b[0m");
    return;
  }

  const presets: PresetId[] = ["base", "typescript"];
  console.log(`  Comparing against: \x1b[36m${presets.join(", ")}\x1b[0m`);
  console.log();

  const proposedConfig = buildConfig({ presets });
  const diff = computeDiff(existing.rules, proposedConfig.rules);
  console.log(formatDiff(diff));
}

function handleShowPresets(): void {
  printSectionHeader("Available Presets");

  for (const preset of getAllPresets()) {
    console.log(`  \x1b[36m${preset.id}\x1b[0m - ${preset.name}`);
    console.log(`    ${preset.description}`);
    if (preset.extends?.length) {
      console.log(`    \x1b[90mExtends: ${preset.extends.join(", ")}\x1b[0m`);
    }
    const ruleCount = Object.keys(preset.rules).length;
    console.log(`    \x1b[90m${ruleCount} rules\x1b[0m`);
    console.log();
  }
}

function handleShowRules(): void {
  printSectionHeader("Rule Database");

  const stats = getStats();

  console.log(`  \x1b[1mTotal rules:\x1b[0m ${stats.totalRules}`);
  console.log(`  Tagged: ${stats.taggedRules}`);
  console.log(`  Fixable: ${stats.fixableRules}`);
  console.log(`  Deprecated: ${stats.deprecatedRules}`);
  console.log(`  Type-checking: ${stats.typeCheckingRules}`);
  console.log();

  console.log("  \x1b[1mBy plugin:\x1b[0m");
  for (const [plugin, count] of Object.entries(stats.rulesByPlugin)) {
    const shortName = plugin.replace("/eslint-plugin", "");
    console.log(`    ${shortName.padEnd(20)} ${count}`);
  }
  console.log();

  console.log("  \x1b[1mBy strictness:\x1b[0m");
  console.log(`    Essential:   ${stats.rulesByStrictness.essential}`);
  console.log(`    Recommended: ${stats.rulesByStrictness.recommended}`);
  console.log(`    Strict:      ${stats.rulesByStrictness.strict}`);
  console.log(`    Pedantic:    ${stats.rulesByStrictness.pedantic}`);
}

function handleShowCurrent(existing: ParsedConfig | null): void {
  printSectionHeader("Current Configuration");

  if (!existing) {
    console.log("  \x1b[31mNo config found\x1b[0m");
    return;
  }

  console.log(`  File: \x1b[36m${existing.filePath}\x1b[0m`);
  console.log(`  Type-checking: ${existing.hasTypeChecking ? "\x1b[32myes\x1b[0m" : "\x1b[90mno\x1b[0m"}`);
  console.log();

  const rules = Object.entries(existing.rules);
  console.log(`  \x1b[1mRules (${rules.length}):\x1b[0m`);
  console.log();

  // Group by prefix
  const coreRules = rules.filter(([name]) => !name.includes("/"));
  const tsRules = rules.filter(([name]) => name.startsWith("@typescript-eslint/"));
  const styleRules = rules.filter(([name]) => name.startsWith("@stylistic/"));

  if (coreRules.length > 0) {
    console.log("  \x1b[90m[core]\x1b[0m");
    for (const [name, value] of coreRules.slice(0, 10)) {
      console.log(`    ${name}: ${formatRuleValue(value)}`);
    }
    if (coreRules.length > 10) {
      console.log(`    \x1b[90m... and ${coreRules.length - 10} more\x1b[0m`);
    }
    console.log();
  }

  if (tsRules.length > 0) {
    console.log("  \x1b[90m[@typescript-eslint]\x1b[0m");
    for (const [name, value] of tsRules.slice(0, 10)) {
      const shortName = name.replace("@typescript-eslint/", "");
      console.log(`    ${shortName}: ${formatRuleValue(value)}`);
    }
    if (tsRules.length > 10) {
      console.log(`    \x1b[90m... and ${tsRules.length - 10} more\x1b[0m`);
    }
    console.log();
  }

  if (styleRules.length > 0) {
    console.log("  \x1b[90m[@stylistic]\x1b[0m");
    for (const [name, value] of styleRules.slice(0, 10)) {
      const shortName = name.replace("@stylistic/", "");
      console.log(`    ${shortName}: ${formatRuleValue(value)}`);
    }
    if (styleRules.length > 10) {
      console.log(`    \x1b[90m... and ${styleRules.length - 10} more\x1b[0m`);
    }
  }
}

function formatRuleValue(value: unknown): string {
  if (typeof value === "string") {
    const colors: Record<string, string> = {
      error: "\x1b[31m",
      warn: "\x1b[33m",
      off: "\x1b[90m",
    };
    return `${colors[value] ?? ""}${value}\x1b[0m`;
  }
  return JSON.stringify(value);
}
