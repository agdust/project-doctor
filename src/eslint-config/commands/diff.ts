import { bold, red, cyan } from "../../utils/colors.js";
import { readExistingConfig } from "../reader/reader.js";
import { buildConfig } from "../builder/builder.js";
import { computeDiff } from "../differ/differ.js";
import { formatDiff } from "../differ/formatter.js";
import type { PresetId } from "../types.js";

export interface DiffOptions {
  presets?: string;
}

export async function runEslintDiff(projectPath: string, options: DiffOptions = {}): Promise<void> {
  console.log();

  const existing = await readExistingConfig(projectPath);
  if (!existing) {
    console.log(red("Error: No existing ESLint config found"));
    console.log();
    console.log(`Run ${cyan("project-doctor eslint init")} to create one`);
    console.log();
    return;
  }

  // Parse presets or use defaults
  let presets: PresetId[] = ["base", "typescript"];
  if (options.presets !== undefined) {
    presets = options.presets.split(",").map((p) => p.trim()) as PresetId[];
  }

  console.log(bold(`Comparing current config to: ${presets.join(", ")}`));
  console.log();

  const proposedConfig = buildConfig({ presets });
  const diff = computeDiff(existing.rules, proposedConfig.rules);

  console.log(formatDiff(diff));
}
