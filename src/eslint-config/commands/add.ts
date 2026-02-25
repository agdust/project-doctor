import { writeFile } from "node:fs/promises";
import { bold, dim, red, green, cyan } from "../../utils/colors.js";
import { readExistingConfig } from "../reader/reader.js";
import { buildConfig } from "../builder/builder.js";
import { generateConfigFile } from "../generator/generator.js";
import { computeDiff } from "../differ/differ.js";
import { formatDiff } from "../differ/formatter.js";
import { confirmApply, WizardCancelledError } from "../wizard/wizard.js";
import { isValidPresetId, getPreset } from "../presets/presets.js";
import type { PresetId } from "../types.js";

export async function runEslintAdd(projectPath: string, presetArg: string): Promise<void> {
  try {
    await runEslintAddInner(projectPath, presetArg);
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

async function runEslintAddInner(projectPath: string, presetArg: string): Promise<void> {
  console.log();

  if (!presetArg) {
    console.log(red("Error: Missing preset name"));
    console.log();
    console.log("Usage: project-doctor eslint add <preset>");
    console.log("Presets: base, typescript, strict, style, security, performance");
    console.log();
    return;
  }

  if (!isValidPresetId(presetArg)) {
    console.log(red(`Error: Invalid preset "${presetArg}"`));
    console.log();
    console.log("Valid presets: base, typescript, strict, style, security, performance");
    console.log();
    return;
  }

  const presetId = presetArg;
  const preset = getPreset(presetId);

  const existing = await readExistingConfig(projectPath);
  if (!existing) {
    console.log(red("Error: No existing ESLint config found"));
    console.log();
    console.log(`Run ${cyan("project-doctor eslint init")} first to create a config`);
    console.log();
    return;
  }

  console.log(bold(`Adding preset: ${preset.name}`));
  console.log(`  ${preset.description}`);
  console.log();

  // Build new config with the additional preset
  // We need to infer current presets from rules - simplified: just add the new preset
  const presets: PresetId[] = ["base", "typescript", presetId];
  const newConfig = buildConfig({ presets });

  // Compute diff
  const diff = computeDiff(existing.rules, newConfig.rules);
  console.log(formatDiff(diff));

  if (diff.entries.length === 0) {
    console.log(`  ${green("✓")} Preset rules already present`);
    console.log();
    return;
  }

  const proceed = await confirmApply();
  if (!proceed) {
    console.log(`  ${dim("Cancelled")}`);
    console.log();
    return;
  }

  // Generate and write
  const fileContent = generateConfigFile(newConfig);
  await writeFile(existing.filePath, fileContent, "utf8");

  console.log(`  ${green("✓")} Updated ${existing.filePath}`);
  console.log();
}
