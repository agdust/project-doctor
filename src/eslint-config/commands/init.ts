import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runWizard, confirmApply, WizardCancelledError } from "../wizard/wizard.js";
import { buildConfig } from "../builder/builder.js";
import { generateConfigFile } from "../generator/generator.js";
import { readExistingConfig } from "../reader/reader.js";
import { computeDiff } from "../differ/differ.js";
import { formatDiff } from "../differ/formatter.js";
import type { PresetId } from "../types.js";
import { isValidPresetId } from "../presets/presets.js";

export type InitOptions = {
  wizard?: boolean;
  presets?: string;
  dryRun?: boolean;
  force?: boolean;
};

export async function runEslintInit(projectPath: string, options: InitOptions): Promise<void> {
  try {
    await runEslintInitInner(projectPath, options);
  } catch (error) {
    if (error instanceof WizardCancelledError) {
      console.log();
      console.log("  \x1b[90mCancelled\x1b[0m");
      console.log();
      return;
    }
    throw error;
  }
}

async function runEslintInitInner(projectPath: string, options: InitOptions): Promise<void> {
  console.log();
  console.log("\x1b[1mESLint Config Generator\x1b[0m");
  console.log();

  // Get presets from wizard or CLI args
  let presets: PresetId[];
  if (options.wizard) {
    const selections = await runWizard();
    presets = selections.presets;
  } else if (options.presets) {
    const parsed = options.presets.split(",").map((p) => p.trim());
    const invalid = parsed.filter((p) => !isValidPresetId(p));
    if (invalid.length > 0) {
      console.log(`\x1b[31mInvalid presets: ${invalid.join(", ")}\x1b[0m`);
      console.log("Valid presets: base, typescript, strict, style, security, performance");
      return;
    }
    presets = parsed as PresetId[];
  } else {
    // Default presets
    presets = ["base", "typescript"];
  }

  console.log(`  Using presets: \x1b[36m${presets.join(", ")}\x1b[0m`);
  console.log();

  // Build the config
  const generatedConfig = buildConfig({ presets });
  const fileContent = generateConfigFile(generatedConfig);

  // Check for existing config
  const existing = await readExistingConfig(projectPath);

  if (existing && !options.force) {
    console.log(`  \x1b[33m!\x1b[0m Found existing config at ${existing.filePath}`);
    console.log();

    // Compute and show diff
    const diff = computeDiff(existing.rules, generatedConfig.rules);
    console.log(formatDiff(diff));

    if (options.dryRun) {
      console.log("  \x1b[90m(dry run - no changes made)\x1b[0m");
      console.log();
      return;
    }

    if (diff.entries.length === 0) {
      console.log("  \x1b[32m✓\x1b[0m Configuration is already up to date");
      console.log();
      return;
    }

    const proceed = await confirmApply();
    if (!proceed) {
      console.log("  \x1b[90mCancelled\x1b[0m");
      console.log();
      return;
    }
  }

  if (options.dryRun) {
    console.log("  \x1b[90mGenerated config (dry run):\x1b[0m");
    console.log();
    console.log(fileContent);
    return;
  }

  // Write the config
  const configPath = join(projectPath, "eslint.config.js");
  await writeFile(configPath, fileContent, "utf-8");

  console.log(`  \x1b[32m✓\x1b[0m Generated eslint.config.js`);
  console.log(`    ${generatedConfig.rules.length} rules configured`);
  console.log();
}
