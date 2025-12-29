import { readExistingConfig } from "../reader/reader.js";
import { buildConfig } from "../builder/builder.js";
import { computeDiff } from "../differ/differ.js";
import { formatDiff } from "../differ/formatter.js";
import type { PresetId } from "../types.js";

export type DiffOptions = {
  presets?: string;
};

export async function runEslintDiff(projectPath: string, options: DiffOptions = {}): Promise<void> {
  console.log();

  const existing = await readExistingConfig(projectPath);
  if (!existing) {
    console.log("\x1b[31mError: No existing ESLint config found\x1b[0m");
    console.log();
    console.log("Run \x1b[36mproject-doctor eslint init\x1b[0m to create one");
    console.log();
    return;
  }

  // Parse presets or use defaults
  let presets: PresetId[] = ["base", "typescript"];
  if (options.presets) {
    presets = options.presets.split(",").map((p) => p.trim()) as PresetId[];
  }

  console.log(`\x1b[1mComparing current config to: ${presets.join(", ")}\x1b[0m`);
  console.log();

  const proposedConfig = buildConfig({ presets });
  const diff = computeDiff(existing.rules, proposedConfig.rules);

  console.log(formatDiff(diff));
}
