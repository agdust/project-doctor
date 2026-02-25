import { writeFile, access } from "node:fs/promises";
import path from "node:path";
import { CONFIG_DIR, CONFIG_FILE, ensureConfigDir } from "../config/constants.js";
import { green, yellow } from "./colors.js";

const DEFAULT_CONFIG = `{
  // Disable specific checks
  // checks: { "changelog-exists": "off" },

  // Disable checks by tag
  // tags: { "opinionated": "off" },

  // Disable entire groups
  // groups: { "eslint": "off" },

  // Temporarily skip until a date (reverts to "error" after)
  // checks: { "some-check": "skip-until-2025-06-01" },
}
`;

export async function runInit(projectPath: string): Promise<void> {
  const configDir = path.join(projectPath, CONFIG_DIR);
  const configPath = path.join(configDir, CONFIG_FILE);

  console.log();

  // Check if config already exists
  try {
    await access(configPath);
    console.log(`  ${yellow("!")} Config already exists at ${CONFIG_DIR}/${CONFIG_FILE}`);
    console.log();
    return;
  } catch {
    // Config doesn't exist, continue
  }

  await ensureConfigDir(projectPath);
  await writeFile(configPath, DEFAULT_CONFIG, "utf8");

  console.log(`  ${green("✓")} Created ${CONFIG_DIR}/${CONFIG_FILE}`);
  console.log();
}
