import { mkdir } from "node:fs/promises";
import path from "node:path";

export const CONFIG_DIR = ".project-doctor";
export const CONFIG_FILE = "config.json5";

/**
 * Ensure the .project-doctor directory exists.
 *
 * @param projectPath - Absolute path to the project directory
 */
export async function ensureConfigDir(projectPath: string): Promise<void> {
  const configDir = path.join(projectPath, CONFIG_DIR);
  await mkdir(configDir, { recursive: true });
}
