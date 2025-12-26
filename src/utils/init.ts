import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_DIR = ".project-doctor";
const CONFIG_FILE = "config.json";

const DEFAULT_CONFIG = {
  excludeTags: [],
  excludeChecks: [],
};

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
  await writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n", "utf-8");

  console.log(`  \x1b[32m✓\x1b[0m Created ${CONFIG_DIR}/${CONFIG_FILE}`);
  console.log();
  console.log("  \x1b[90mAvailable options:\x1b[0m");
  console.log("    excludeTags    - Skip checks with these tags");
  console.log("    excludeChecks  - Skip specific checks by name");
  console.log("    groups         - Only run checks from these groups");
  console.log("    includeTags    - Only run checks with these tags");
  console.log();
}
