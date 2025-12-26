import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_DIR = ".project-doctor";
const CONFIG_FILE = "config.json5";

const DEFAULT_CONFIG = `{
  // Skip checks with these tags
  // excludeTags: ["opinionated"],

  // Skip specific checks by name
  // excludeChecks: ["changelog-exists"],

  // Only run checks from these groups
  // groups: ["package-json", "typescript"],

  // Only run checks with these tags
  // includeTags: ["required"],
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
