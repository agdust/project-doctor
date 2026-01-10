import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_DIR = ".project-doctor";
const CONFIG_FILE = "config.json5";

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
  const configDir = join(projectPath, CONFIG_DIR);
  const configPath = join(configDir, CONFIG_FILE);

  console.log();

  // Check if config already exists
  try {
    await access(configPath);
    console.log(`  \x1b[33m!\x1b[0m Config already exists at ${CONFIG_DIR}/${CONFIG_FILE}`);
    console.log();
    return;
  } catch {
    // Config doesn't exist, continue
  }

  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, DEFAULT_CONFIG, "utf-8");

  console.log(`  \x1b[32m✓\x1b[0m Created ${CONFIG_DIR}/${CONFIG_FILE}`);
  console.log();
}
