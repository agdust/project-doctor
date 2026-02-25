import { writeFile } from "node:fs/promises";
import path from "node:path";
import { bold, dim, red, green, yellow, cyan } from "../../utils/colors.js";
import { runWizard, confirmApply, WizardCancelledError } from "../wizard/wizard.js";
import { buildConfig } from "../builder/builder.js";
import { generateConfigFile } from "../generator/generator.js";
import { readExistingConfig } from "../reader/reader.js";
import { computeDiff } from "../differ/differ.js";
import { formatDiff } from "../differ/formatter.js";
import type { PresetId } from "../types.js";
import { isValidPresetId } from "../presets/presets.js";

export interface InitOptions {
  wizard?: boolean;
  presets?: string;
  dryRun?: boolean;
  force?: boolean;
}

export async function runEslintInit(projectPath: string, options: InitOptions): Promise<void> {
  try {
    await runEslintInitInner(projectPath, options);
  } catch (error) {
    if (error instanceof WizardCancelledError) {
      console.log();
      console.log(`  ${dim("Cancelled")}`);
      console.log();
      return;
    }
    throw error;
  }
}

async function runEslintInitInner(projectPath: string, options: InitOptions): Promise<void> {
  console.log();
  console.log(bold("ESLint Config Generator"));
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
      console.log(red(`Invalid presets: ${invalid.join(", ")}`));
      console.log("Valid presets: base, typescript, strict, style, security, performance");
      return;
    }
    presets = parsed as PresetId[];
  } else {
    // Default presets
    presets = ["base", "typescript"];
  }

  console.log(`  Using presets: ${cyan(presets.join(", "))}`);
  console.log();

  // Build the config
  const generatedConfig = buildConfig({ presets });
  const fileContent = generateConfigFile(generatedConfig);

  // Check for existing config
  const existing = await readExistingConfig(projectPath);

  if (existing && !options.force) {
    console.log(`  ${yellow("!")} Found existing config at ${existing.filePath}`);
    console.log();

    // Compute and show diff
    const diff = computeDiff(existing.rules, generatedConfig.rules);
    console.log(formatDiff(diff));

    if (options.dryRun) {
      console.log(`  ${dim("(dry run - no changes made)")}`);
      console.log();
      return;
    }

    if (diff.entries.length === 0) {
      console.log(`  ${green("✓")} Configuration is already up to date`);
      console.log();
      return;
    }

    const proceed = await confirmApply();
    if (!proceed) {
      console.log(`  ${dim("Cancelled")}`);
      console.log();
      return;
    }
  }

  if (options.dryRun) {
    console.log(`  ${dim("Generated config (dry run):")}`);
    console.log();
    console.log(fileContent);
    return;
  }

  // Write the config
  const configPath = path.join(projectPath, "eslint.config.js");
  await writeFile(configPath, fileContent, "utf8");

  console.log(`  ${green("✓")} Generated eslint.config.js`);
  console.log(`    ${generatedConfig.rules.length} rules configured`);
  console.log();
}
