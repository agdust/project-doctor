import { writeFile } from "node:fs/promises";
import { readExistingConfig } from "../reader/reader.js";
import { buildConfig } from "../builder/builder.js";
import { generateConfigFile } from "../generator/generator.js";
import { computeDiff } from "../differ/differ.js";
import { formatDiff } from "../differ/formatter.js";
import { confirmApply } from "../wizard/wizard.js";
import { isValidPresetId, getPreset } from "../presets/presets.js";
import type { PresetId } from "../types.js";

export async function runEslintAdd(projectPath: string, presetArg: string): Promise<void> {
  console.log();

  if (!presetArg) {
    console.log("\x1b[31mError: Missing preset name\x1b[0m");
    console.log();
    console.log("Usage: project-doctor eslint add <preset>");
    console.log("Presets: base, typescript, strict, style, security, performance");
    console.log();
    return;
  }

  if (!isValidPresetId(presetArg)) {
    console.log(`\x1b[31mError: Invalid preset "${presetArg}"\x1b[0m`);
    console.log();
    console.log("Valid presets: base, typescript, strict, style, security, performance");
    console.log();
    return;
  }

  const presetId = presetArg as PresetId;
  const preset = getPreset(presetId);

  const existing = await readExistingConfig(projectPath);
  if (!existing) {
    console.log("\x1b[31mError: No existing ESLint config found\x1b[0m");
    console.log();
    console.log("Run \x1b[36mproject-doctor eslint init\x1b[0m first to create a config");
    console.log();
    return;
  }

  console.log(`\x1b[1mAdding preset: ${preset.name}\x1b[0m`);
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
    console.log("  \x1b[32m✓\x1b[0m Preset rules already present");
    console.log();
    return;
  }

  const proceed = await confirmApply();
  if (!proceed) {
    console.log("  \x1b[90mCancelled\x1b[0m");
    console.log();
    return;
  }

  // Generate and write
  const fileContent = generateConfigFile(newConfig);
  await writeFile(existing.filePath, fileContent, "utf-8");

  console.log(`  \x1b[32m✓\x1b[0m Updated ${existing.filePath}`);
  console.log();
}
