/**
 * Utilities for editing JSON files while preserving formatting conventions.
 *
 * These helpers are designed for auto-fix operations that need to modify
 * package.json, tsconfig.json, and other JSON config files.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Read and parse a JSON file.
 * Returns null if the file doesn't exist or is invalid JSON.
 */
export async function readJson<T>(projectPath: string, filename: string): Promise<T | null> {
  try {
    const content = await readFile(join(projectPath, filename), "utf-8");
    return JSON.parse(content) as T;
  } catch {
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
  await writeFile(join(projectPath, filename), content, "utf-8");
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
  let current: Record<string, unknown> = obj as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return obj;
}
