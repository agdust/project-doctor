import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

export const CONFIG_DIR = ".project-doctor";
export const CONFIG_FILE = "config.json5";

const GITIGNORE_CONTENT = `/cache/
`;

/**
 * Ensure the .project-doctor directory exists with a .gitignore file.
 *
 * Creates the directory if it doesn't exist, and adds a .gitignore
 * that ignores the cache folder.
 *
 * @param projectPath - Absolute path to the project directory
 */
export async function ensureConfigDir(projectPath: string): Promise<void> {
  const configDir = join(projectPath, CONFIG_DIR);
  const gitignorePath = join(configDir, ".gitignore");

  // Create directory
  await mkdir(configDir, { recursive: true });

  // Create .gitignore if it doesn't exist
  try {
    await access(gitignorePath);
  } catch {
    // File doesn't exist, create it
    await writeFile(gitignorePath, GITIGNORE_CONTENT, "utf-8");
  }
}
