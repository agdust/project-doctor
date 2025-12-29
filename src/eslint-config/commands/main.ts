import { select } from "@inquirer/prompts";
import { readExistingConfig } from "../reader/reader.js";
import { runEslintInit } from "./init.js";
import { runEslintShow } from "./show.js";
import { runEslintDiff } from "./diff.js";
import { runEslintAdd } from "./add.js";
import type { ParsedConfig, PresetId } from "../types.js";
import { getAllPresets } from "../presets/presets.js";

type WizardAction =
  | "init-wizard"
  | "init-default"
  | "analyze"
  | "add-preset"
  | "show-diff"
  | "show-presets"
  | "show-rules"
  | "exit";

export async function runMainWizard(projectPath: string): Promise<void> {
  console.log();
  console.log("\x1b[1m┌─────────────────────────────────────────────────────────┐\x1b[0m");
  console.log("\x1b[1m│  ESLint Configuration Builder                           │\x1b[0m");
  console.log("\x1b[1m└─────────────────────────────────────────────────────────┘\x1b[0m");
  console.log();

  const existing = await readExistingConfig(projectPath);

  if (existing) {
    await runWithExistingConfig(projectPath, existing);
    return;
  }

  await runWithoutConfig(projectPath);
}

async function runWithExistingConfig(projectPath: string, existing: ParsedConfig): Promise<void> {
  const ruleCount = Object.keys(existing.rules).length;
  const typeCheckingStatus = existing.hasTypeChecking ? "\x1b[32menabled\x1b[0m" : "\x1b[90mdisabled\x1b[0m";

  console.log(`  \x1b[32m✓\x1b[0m Found: \x1b[36m${existing.filePath}\x1b[0m`);
  console.log(`    ${ruleCount} rules configured, type-checking ${typeCheckingStatus}`);
  console.log();

  const action = await select<WizardAction>({
    message: "What would you like to do?",
    choices: [
      {
        name: "Analyze config vs recommendations",
        value: "analyze",
        description: "Compare your config against project-doctor's recommended rules",
      },
      {
        name: "Add a preset",
        value: "add-preset",
        description: "Add security, performance, strict, or style rules",
      },
      {
        name: "Show diff against recommended",
        value: "show-diff",
        description: "See what rules differ from base + typescript presets",
      },
      {
        name: "Regenerate config (wizard)",
        value: "init-wizard",
        description: "Start fresh with the interactive wizard",
      },
      {
        name: "View available presets",
        value: "show-presets",
        description: "List all presets and their rule counts",
      },
      {
        name: "View rule database stats",
        value: "show-rules",
        description: "See statistics about the rule database",
      },
      {
        name: "Exit",
        value: "exit",
      },
    ],
  });

  await executeAction(projectPath, action);
}

async function runWithoutConfig(projectPath: string): Promise<void> {
  console.log("  \x1b[33m!\x1b[0m No ESLint config found");
  console.log();

  const action = await select<WizardAction>({
    message: "What would you like to do?",
    choices: [
      {
        name: "Create config (interactive wizard)",
        value: "init-wizard",
        description: "Answer questions to build a customized config",
      },
      {
        name: "Create config (quick start)",
        value: "init-default",
        description: "Use base + typescript presets (recommended)",
      },
      {
        name: "View available presets",
        value: "show-presets",
        description: "List all presets before deciding",
      },
      {
        name: "View rule database stats",
        value: "show-rules",
        description: "See statistics about available rules",
      },
      {
        name: "Exit",
        value: "exit",
      },
    ],
  });

  await executeAction(projectPath, action);
}

async function executeAction(projectPath: string, action: WizardAction): Promise<void> {
  switch (action) {
    case "init-wizard":
      await runEslintInit(projectPath, { wizard: true });
      break;

    case "init-default":
      await runEslintInit(projectPath, { presets: "base,typescript" });
      break;

    case "analyze":
      await runAnalysis(projectPath);
      break;

    case "add-preset":
      await runAddPresetWizard(projectPath);
      break;

    case "show-diff":
      await runEslintDiff(projectPath, {});
      break;

    case "show-presets":
      await runEslintShow(projectPath, { presets: true });
      break;

    case "show-rules":
      await runEslintShow(projectPath, { rules: true });
      break;

    case "exit":
      console.log();
      break;
  }
}

async function runAnalysis(projectPath: string): Promise<void> {
  const existing = await readExistingConfig(projectPath);
  if (!existing) {
    console.log("\x1b[31mError: No config found\x1b[0m");
    return;
  }

  console.log();
  console.log("\x1b[1mConfig Analysis\x1b[0m");
  console.log();

  const ruleCount = Object.keys(existing.rules).length;
  const presets = getAllPresets();

  console.log(`  Current config: \x1b[1m${ruleCount}\x1b[0m rules`);
  console.log();
  console.log("  \x1b[1mCoverage by preset:\x1b[0m");
  console.log();

  for (const preset of presets) {
    const presetRuleNames = Object.keys(preset.rules);
    const covered = presetRuleNames.filter((name) => name in existing.rules);
    const percentage = presetRuleNames.length > 0
      ? Math.round((covered.length / presetRuleNames.length) * 100)
      : 0;

    const bar = renderProgressBar(percentage);
    const color = percentage >= 80 ? "\x1b[32m" : percentage >= 50 ? "\x1b[33m" : "\x1b[31m";

    console.log(`  ${preset.id.padEnd(12)} ${bar} ${color}${percentage}%\x1b[0m (${covered.length}/${presetRuleNames.length})`);
  }

  console.log();
  console.log("  \x1b[90mRun 'project-doctor eslint diff --presets <preset>' to see specific differences\x1b[0m");
  console.log();
}

function renderProgressBar(percentage: number): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

async function runAddPresetWizard(projectPath: string): Promise<void> {
  const existing = await readExistingConfig(projectPath);
  if (!existing) {
    console.log("\x1b[31mError: No config found\x1b[0m");
    return;
  }

  const presets = getAllPresets();
  const currentRules = Object.keys(existing.rules);

  // Calculate coverage for each preset to show which are already covered
  const presetChoices = presets
    .filter((p) => p.id !== "base") // base is usually included by default
    .map((preset) => {
      const presetRuleNames = Object.keys(preset.rules);
      const covered = presetRuleNames.filter((name) => currentRules.includes(name));
      const percentage = presetRuleNames.length > 0
        ? Math.round((covered.length / presetRuleNames.length) * 100)
        : 0;

      let status = "";
      if (percentage === 100) {
        status = " \x1b[32m(fully covered)\x1b[0m";
      } else if (percentage > 0) {
        status = ` \x1b[33m(${percentage}% covered)\x1b[0m`;
      }

      return {
        name: `${preset.name}${status}`,
        value: preset.id,
        description: preset.description,
      };
    });

  const presetId = await select<PresetId>({
    message: "Which preset would you like to add?",
    choices: presetChoices,
  });

  await runEslintAdd(projectPath, presetId);
}
