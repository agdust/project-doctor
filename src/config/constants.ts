import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

export const CONFIG_DIR = ".project-doctor";
export const CONFIG_FILE = "config.json5";

const CACHE_PATTERN = ".project-doctor/cache/";

/**
 * Ensure the .project-doctor directory exists and cache is gitignored.
 *
 * Creates the directory if it doesn't exist, and adds .project-doctor/cache/
 * to the project's .gitignore if not already present.
 *
 * @param projectPath - Absolute path to the project directory
 */
export async function ensureConfigDir(projectPath: string): Promise<void> {
  const configDir = join(projectPath, CONFIG_DIR);
  const gitignorePath = join(projectPath, ".gitignore");

  // Create directory
  await mkdir(configDir, { recursive: true });

  // Add cache to project's .gitignore if it exists and doesn't have the pattern
  try {
    await access(gitignorePath);
    const content = await readFile(gitignorePath, "utf-8");
    const lines = content.split("\n").map((l) => l.trim());
    const hasPattern = lines.some((l) =>
      [".project-doctor/cache", ".project-doctor/cache/"].includes(l)
    );
    if (!hasPattern) {
      const newContent = content.endsWith("\n")
        ? content + CACHE_PATTERN + "\n"
        : content + "\n" + CACHE_PATTERN + "\n";
      await writeFile(gitignorePath, newContent, "utf-8");
    }
  } catch {
    // No .gitignore exists - don't create one, let the check handle it
  }
}
