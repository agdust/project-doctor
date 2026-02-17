import { readFile, stat } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import type { FileCache } from "../types.js";
import { safeJsonParse } from "../utils/safe-json.js";

/**
 * Validate that a relative path doesn't escape the project directory.
 * Prevents path traversal attacks (e.g., "../../../etc/passwd").
 */
function validateRelativePath(projectPath: string, relativePath: string): string {
  const fullPath = resolve(projectPath, relativePath);
  const resolvedRelative = relative(projectPath, fullPath);

  // Path escapes project directory if it starts with ".." or is absolute
  if (resolvedRelative.startsWith("..") || resolve(resolvedRelative) === resolvedRelative) {
    throw new Error(`Path traversal not allowed: ${relativePath}`);
  }

  return fullPath;
}

export function createFileCache(projectPath: string): FileCache {
  const textCache = new Map<string, string | null>();
  const jsonCache = new Map<string, unknown>();
  const existsCache = new Map<string, boolean>();

  return {
    async readText(relativePath: string): Promise<string | null> {
      if (textCache.has(relativePath)) {
        return textCache.get(relativePath) ?? null;
      }

      try {
        const fullPath = validateRelativePath(projectPath, relativePath);
        const content = await readFile(fullPath, "utf-8");
        textCache.set(relativePath, content);
        return content;
      } catch {
        // File doesn't exist, path invalid, or read error
        textCache.set(relativePath, null);
        return null;
      }
    },

    async readJson<T>(relativePath: string): Promise<T | null> {
      const cacheKey = relativePath;
      if (jsonCache.has(cacheKey)) {
        return jsonCache.get(cacheKey) as T | null;
      }

      const text = await this.readText(relativePath);
      if (!text) {
        jsonCache.set(cacheKey, null);
        return null;
      }

      const parsed = safeJsonParse<T>(text);
      jsonCache.set(cacheKey, parsed);
      return parsed;
    },

    async exists(relativePath: string): Promise<boolean> {
      if (existsCache.has(relativePath)) {
        return existsCache.get(relativePath) ?? false;
      }

      try {
        const fullPath = validateRelativePath(projectPath, relativePath);
        await stat(fullPath);
        existsCache.set(relativePath, true);
        return true;
      } catch {
        // File doesn't exist, path invalid, or stat error
        existsCache.set(relativePath, false);
        return false;
      }
    },
  };
}
