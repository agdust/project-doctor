/**
 * Utilities for editing JSON files while preserving formatting conventions.
 *
 * These helpers are designed for auto-fix operations that need to modify
 * package.json, tsconfig.json, and other JSON config files.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { safeJsonParse } from "./safe-json.js";

/**
 * Read and parse a JSON file.
 * Returns null if the file doesn't exist or is invalid JSON.
 */
export async function readJson<T>(projectPath: string, filename: string): Promise<T | null> {
  try {
    const content = await readFile(path.join(projectPath, filename), "utf8");
    return safeJsonParse<T>(content);
  } catch (error) {
    // Log in debug mode to help diagnose issues (permissions, etc.)
    if (process.env.DEBUG) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[DEBUG] readJson(${filename}): ${msg}`);
    }
    return null;
  }
}

/**
 * Write a JSON file with consistent formatting.
 * Uses 2-space indentation and a trailing newline.
 */
export async function writeJson(
  projectPath: string,
  filename: string,
  data: unknown,
): Promise<void> {
  const content = JSON.stringify(data, null, 2) + "\n";
  await writeFile(path.join(projectPath, filename), content, "utf8");
}

/**
 * Update a JSON file by applying a transform function.
 * Returns success/failure result with message.
 */
export async function updateJson<T extends object>(
  projectPath: string,
  filename: string,
  transform: (data: T) => T,
): Promise<{ success: boolean; message: string }> {
  const data = await readJson<T>(projectPath, filename);
  if (!data) {
    return { success: false, message: `Could not read ${filename}` };
  }

  const updated = transform(data);
  await writeJson(projectPath, filename, updated);
  return { success: true, message: `Updated ${filename}` };
}

/**
 * Set a field in package.json (or similar JSON file).
 * Creates nested objects as needed (e.g., "engines.node").
 */
export function setNestedField<T extends object>(obj: T, path: string, value: unknown): T {
  const parts = path.split(".");
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "")) {
    return obj; // Empty path, return unchanged
  }

  let current: Record<string, unknown> = obj as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- parts.length > 0 guaranteed above
  current[parts.at(-1)!] = value;
  return obj;
}
