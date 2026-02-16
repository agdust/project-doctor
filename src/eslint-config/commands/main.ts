/**
 * ESLint CLI - Main Entry Point
 *
 * Uses the CLI framework for consistent navigation:
 * - Ctrl+C: Exit from anywhere
 * - ESC: Go back one level
 * - Every menu has Back/Exit options
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  runApp,
  createScreen,
  select,
  BACK,
  EXIT,
  isBack,
  printSection,
  printSuccess,
  printCancelled,
  progressBar,
  formatRuleValue,
  color,
  ensureSafeToModify,
} from "../cli/cli.js";

import { readExistingConfig } from "../reader/reader.js";
import { buildConfig } from "../builder/builder.js";
import { generateConfigFile } from "../generator/generator.js";
import { getAllPresets, getPreset } from "../presets/presets.js";
import { getStats } from "../../eslint-db/index.js";
import type { ParsedConfig, PresetId } from "../types.js";
import type { RuleStrictness, RuleConcern } from "../../eslint-db/types.js";
import { buildPresetsFromSelections } from "../wizard/wizard.js";

// App context passed through screens
interface AppContext {
  projectPath: string;
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function runMainWizard(projectPath: string): Promise<void> {
  await runApp(mainMenuScreen, { projectPath });
}

// ============================================================================
// Main Menu Screen
// ============================================================================

const mainMenuScreen = createScreen<AppContext>("main", "Main Menu", async (ctx, app) => {
  const existing = await readExistingConfig(ctx.projectPath);

  // Show current status
  if (existing) {
    const ruleCount = Object.keys(existing.rules).length;
    const typeChecking = existing.hasTypeChecking ? color.green("enabled") : color.dim("disabled");
    console.log(`  ${color.green("✓")} Config: ${color.cyan(existing.filePath)}`);
    console.log(`    ${ruleCount} rules, type-checking ${typeChecking}`);
  } else {
    console.log(`  ${color.yellow("!")} No ESLint config found in this project`);
  }
  console.log();

  type Action = "analyze" | "add" | "wizard" | "quick" | "presets" | "rules" | "current";

  const choices = existing
    ? [
        {
          name: "📊 Analyze config",
          value: "analyze" as Action,
          description: "Compare against recommended",
        },
        {
          name: "➕ Add a preset",
          value: "add" as Action,
          description: "Add security, performance, strict",
        },
        {
          name: "🔄 Regenerate config",
          value: "wizard" as Action,
          description: "Start fresh with wizard",
        },
        {
          name: "📦 View presets",
          value: "presets" as Action,
          description: "List available presets",
        },
        {
          name: "📚 View rule stats",
          value: "rules" as Action,
          description: "Database statistics",
        },
        {
          name: "📄 Show current config",
          value: "current" as Action,
          description: "Display parsed rules",
        },
      ]
    : [
        {
          name: "🧙 Create config (wizard)",
          value: "wizard" as Action,
          description: "Interactive guided setup",
        },
        {
          name: "⚡ Create config (quick)",
          value: "quick" as Action,
          description: "Use recommended defaults",
        },
        {
          name: "📦 View presets",
          value: "presets" as Action,
          description: "See what's available",
        },
        {
          name: "📚 View rule stats",
          value: "rules" as Action,
          description: "Database statistics",
        },
      ];

  const action = await select({
    message: "What would you like to do?",
    choices,
    includeExit: true,
  });

  if (action === EXIT || action === BACK) {
    return EXIT;
  }

  // Navigate to appropriate screen
  switch (action) {
    case "analyze":
      app.push(analyzeScreen, { ...ctx, existing: existing! });
      break;
    case "add":
      app.push(addPresetScreen, { ...ctx, existing: existing! });
      break;
    case "wizard":
      app.push(wizardScreen, { ...ctx, existing });
      break;
    case "quick":
      app.push(quickSetupScreen, ctx);
      break;
    case "presets":
      app.push(presetsScreen, ctx);
      break;
    case "rules":
      app.push(rulesScreen, ctx);
      break;
    case "current":
      app.push(currentConfigScreen, { ...ctx, existing: existing! });
      break;
  }
});

// ============================================================================
// Analyze Screen
// ============================================================================

type AnalyzeContext = AppContext & { existing: ParsedConfig };

const analyzeScreen = createScreen<AnalyzeContext>("analyze", "Analyze Config", async (ctx) => {
  printSection("Config Analysis");

  const ruleCount = Object.keys(ctx.existing.rules).length;
  const presets = getAllPresets();

  console.log(`  Your config has ${color.bold(String(ruleCount))} rules configured`);
  console.log();
  console.log(`  ${color.bold("Coverage by preset:")}`);
  console.log();

  for (const preset of presets) {
    const presetRuleNames = Object.keys(preset.rules);
    const covered = presetRuleNames.filter((name) => name in ctx.existing.rules);
    const percentage =
      presetRuleNames.length > 0 ? Math.round((covered.length / presetRuleNames.length) * 100) : 0;

    const bar = progressBar(percentage);
    const pctColor = percentage >= 80 ? color.green : percentage >= 50 ? color.yellow : color.red;

    console.log(
      `  ${preset.id.padEnd(12)} ${bar} ${pctColor(String(percentage).padStart(3) + "%")}  (${covered.length}/${presetRuleNames.length} rules)`,
    );
  }
  console.log();

  // Wait for user to acknowledge
  await select({
    message: "",
    choices: [],
    includeBack: true,
    backLabel: "Back to main menu",
  });

  return BACK;
});

// ============================================================================
// Add Preset Screen
// ============================================================================

const addPresetScreen = createScreen<AnalyzeContext>("add-preset", "Add Preset", async (ctx) => {
  printSection("Add Preset");

  const allPresets = getAllPresets();
  const currentRules = Object.keys(ctx.existing.rules);

  const presetChoices = allPresets
    .filter((p) => p.id !== "base")
    .map((preset) => {
      const presetRuleNames = Object.keys(preset.rules);
      const covered = presetRuleNames.filter((name) => currentRules.includes(name));
      const percentage =
        presetRuleNames.length > 0
          ? Math.round((covered.length / presetRuleNames.length) * 100)
          : 0;

      let badge = "";
      if (percentage === 100) {
        badge = ` ${color.green("✓ complete")}`;
      } else if (percentage > 0) {
        badge = ` ${color.yellow(percentage + "%")}`;
      }

      return {
        name: `${preset.name}${badge}`,
        value: preset.id,
        description: preset.description,
      };
    });

  const presetIdResult = await select<PresetId>({
    message: "Which preset to add?",
    choices: presetChoices,
    includeBack: true,
  });

  if (isBack(presetIdResult) || presetIdResult === EXIT) {
    return BACK;
  }

  const presetId = presetIdResult as PresetId;
  const preset = getPreset(presetId);

  // Safety check before modifying
  const safe = await ensureSafeToModify(ctx.projectPath);
  if (!safe) {
    printCancelled();
    return BACK;
  }

  // Apply immediately
  const selectedPresets: PresetId[] = ["base", "typescript", presetId];
  const newConfig = buildConfig({ presets: selectedPresets });
  const fileContent = generateConfigFile(newConfig);
  await writeFile(ctx.existing.filePath, fileContent, "utf-8");

  printSuccess(`Updated config with ${preset.name} preset`);

  return BACK;
});

// ============================================================================
// Wizard Screen
// ============================================================================

type WizardContext = AppContext & { existing: ParsedConfig | null };

const wizardScreen = createScreen<WizardContext>("wizard", "Configuration Wizard", async (ctx) => {
  printSection("Configuration Wizard");

  // Project type
  const projectTypeResult = await select<"ts" | "js">({
    message: "What type of project is this?",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "JavaScript", value: "js" },
    ],
    includeBack: true,
  });

  if (isBack(projectTypeResult)) {
    return BACK;
  }
  const projectType = projectTypeResult as "ts" | "js";

  // Strictness level
  const strictnessResult = await select<RuleStrictness>({
    message: "How strict should the linting be?",
    choices: [
      { name: "Essential - Only catch real bugs", value: "essential" },
      { name: "Recommended - Best practices (default)", value: "recommended" },
      { name: "Strict - Stricter than recommended", value: "strict" },
      { name: "Pedantic - Maximum strictness", value: "pedantic" },
    ],
    includeBack: true,
  });

  if (isBack(strictnessResult)) {
    return BACK;
  }
  const strictness = strictnessResult as RuleStrictness;

  // Concerns - using checkbox import from framework
  const { checkbox } = await import("../cli/cli.js");
  const concerns = await checkbox<RuleConcern>({
    message: "Which concerns should be covered?",
    choices: [
      { name: "Error prevention", value: "error-prevention", checked: true },
      { name: "Best practices", value: "best-practice", checked: true },
      { name: "Security", value: "security", checked: true },
      { name: "Performance", value: "performance" },
      { name: "Style (formatting)", value: "style" },
      { name: "Type safety", value: "type-safety", checked: projectType === "ts" },
      { name: "Maintainability", value: "maintainability" },
    ],
  });

  if (isBack(concerns)) {
    return BACK;
  }

  const presets = buildPresetsFromSelections(projectType, strictness, concerns);

  // Safety check before modifying
  const safe = await ensureSafeToModify(ctx.projectPath);
  if (!safe) {
    printCancelled();
    return BACK;
  }

  // Apply immediately
  const config = buildConfig({ presets });
  const fileContent = generateConfigFile(config);

  console.log();
  console.log(`  Presets: ${color.cyan(presets.join(", "))}`);
  console.log(`  Rules: ${color.bold(String(config.rules.length))}`);
  console.log();

  const configPath = join(ctx.projectPath, "eslint.config.js");
  await writeFile(configPath, fileContent, "utf-8");
  printSuccess("Created eslint.config.js");

  return BACK;
});

// ============================================================================
// Quick Setup Screen
// ============================================================================

const quickSetupScreen = createScreen<AppContext>("quick", "Quick Setup", async (ctx) => {
  printSection("Quick Setup");

  // Safety check before modifying
  const safe = await ensureSafeToModify(ctx.projectPath);
  if (!safe) {
    printCancelled();
    return BACK;
  }

  // Apply immediately
  const presets: PresetId[] = ["base", "typescript"];
  const config = buildConfig({ presets });
  const fileContent = generateConfigFile(config);

  console.log(`  Using presets: ${color.cyan(presets.join(", "))}`);
  console.log(`  Rules: ${color.bold(String(config.rules.length))}`);
  console.log();

  const configPath = join(ctx.projectPath, "eslint.config.js");
  await writeFile(configPath, fileContent, "utf-8");
  printSuccess("Created eslint.config.js");

  return BACK;
});

// ============================================================================
// Presets Screen
// ============================================================================

const presetsScreen = createScreen<AppContext>("presets", "Available Presets", async () => {
  printSection("Available Presets");

  for (const preset of getAllPresets()) {
    console.log(`  ${color.cyan(preset.id)} - ${preset.name}`);
    console.log(`    ${preset.description}`);
    if (preset.extends?.length) {
      console.log(`    ${color.dim("Extends: " + preset.extends.join(", "))}`);
    }
    const ruleCount = Object.keys(preset.rules).length;
    console.log(`    ${color.dim(ruleCount + " rules")}`);
    console.log();
  }

  // Wait for user to acknowledge
  await select({
    message: "",
    choices: [],
    includeBack: true,
    backLabel: "Back to main menu",
  });

  return BACK;
});

// ============================================================================
// Rules Screen
// ============================================================================

const rulesScreen = createScreen<AppContext>("rules", "Rule Database", async () => {
  printSection("Rule Database");

  const stats = getStats();

  console.log(`  ${color.bold("Total rules:")} ${stats.totalRules}`);
  console.log(`  Tagged: ${stats.taggedRules}`);
  console.log(`  Fixable: ${stats.fixableRules}`);
  console.log(`  Deprecated: ${stats.deprecatedRules}`);
  console.log(`  Type-checking: ${stats.typeCheckingRules}`);
  console.log();

  console.log(`  ${color.bold("By plugin:")}`);
  for (const [plugin, count] of Object.entries(stats.rulesByPlugin)) {
    const shortName = plugin.replace("/eslint-plugin", "");
    console.log(`    ${shortName.padEnd(20)} ${count}`);
  }
  console.log();

  console.log(`  ${color.bold("By strictness:")}`);
  console.log(`    Essential:   ${stats.rulesByStrictness.essential}`);
  console.log(`    Recommended: ${stats.rulesByStrictness.recommended}`);
  console.log(`    Strict:      ${stats.rulesByStrictness.strict}`);
  console.log(`    Pedantic:    ${stats.rulesByStrictness.pedantic}`);
  console.log();

  // Wait for user to acknowledge
  await select({
    message: "",
    choices: [],
    includeBack: true,
    backLabel: "Back to main menu",
  });

  return BACK;
});

// ============================================================================
// Current Config Screen
// ============================================================================

const currentConfigScreen = createScreen<AnalyzeContext>(
  "current",
  "Current Config",
  async (ctx) => {
    printSection("Current Configuration");

    console.log(`  File: ${color.cyan(ctx.existing.filePath)}`);
    console.log(
      `  Type-checking: ${ctx.existing.hasTypeChecking ? color.green("yes") : color.dim("no")}`,
    );
    console.log();

    const rules = Object.entries(ctx.existing.rules);
    console.log(`  ${color.bold(`Rules (${rules.length}):`)} `);
    console.log();

    // Group by prefix
    const coreRules = rules.filter(([name]) => !name.includes("/"));
    const tsRules = rules.filter(([name]) => name.startsWith("@typescript-eslint/"));
    const styleRules = rules.filter(([name]) => name.startsWith("@stylistic/"));

    if (coreRules.length > 0) {
      console.log(`  ${color.dim("[core]")}`);
      for (const [name, value] of coreRules.slice(0, 10)) {
        console.log(`    ${name}: ${formatRuleValue(value)}`);
      }
      if (coreRules.length > 10) {
        console.log(`    ${color.dim(`... and ${coreRules.length - 10} more`)}`);
      }
      console.log();
    }

    if (tsRules.length > 0) {
      console.log(`  ${color.dim("[@typescript-eslint]")}`);
      for (const [name, value] of tsRules.slice(0, 10)) {
        const shortName = name.replace("@typescript-eslint/", "");
        console.log(`    ${shortName}: ${formatRuleValue(value)}`);
      }
      if (tsRules.length > 10) {
        console.log(`    ${color.dim(`... and ${tsRules.length - 10} more`)}`);
      }
      console.log();
    }

    if (styleRules.length > 0) {
      console.log(`  ${color.dim("[@stylistic]")}`);
      for (const [name, value] of styleRules.slice(0, 10)) {
        const shortName = name.replace("@stylistic/", "");
        console.log(`    ${shortName}: ${formatRuleValue(value)}`);
      }
      if (styleRules.length > 10) {
        console.log(`    ${color.dim(`... and ${styleRules.length - 10} more`)}`);
      }
      console.log();
    }

    // Wait for user to acknowledge
    await select({
      message: "",
      choices: [],
      includeBack: true,
      backLabel: "Back to main menu",
    });

    return BACK;
  },
);
