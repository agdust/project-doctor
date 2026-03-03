import { readFile, stat, realpath } from "node:fs/promises";
import path from "node:path";
import type { FileCache } from "../types.js";
import { safeJsonParse } from "../utils/safe-json.js";

/**
 * Validate that a relative path doesn't escape the project directory.
 * Prevents path traversal attacks (e.g., "../../../etc/passwd").
 *
 * Security considerations:
 * - Checks for ".." path components
 * - Uses path.isAbsolute() for reliable absolute path detection
 * - Resolves symlinks in the project path to prevent symlink-based traversal
 */
async function validateRelativePath(
  projectPath: string,
  relativePath: string,
  resolvedProjectPath?: string,
): Promise<string> {
  const fullPath = path.resolve(projectPath, relativePath);
  const resolvedRelative = path.relative(projectPath, fullPath);

  // Path escapes project directory if:
  // 1. It starts with ".." (goes up from project root)
  // 2. It's an absolute path (e.g., /etc/passwd on Unix, C:\... on Windows)
  // AGENT: what if path does not start with .., bit has it in the middle?
  if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative)) {
    throw new Error(`Path traversal not allowed: ${relativePath}`);
  }

  // If we have the resolved (real) project path, also verify the full path
  // stays within it after symlink resolution
  if (resolvedProjectPath !== undefined) {
    try {
      const realFullPath = await realpath(fullPath);
      if (!realFullPath.startsWith(resolvedProjectPath)) {
        throw new Error(`Path traversal via symlink not allowed: ${relativePath}`);
      }
    } catch (error) {
      // File doesn't exist yet - that's fine, we just can't verify symlinks
      // The basic path check above is still valid
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  return fullPath;
}

export async function createFileCache(projectPath: string): Promise<FileCache> {
  const textCache = new Map<string, string | null>();
  const jsonCache = new Map<string, unknown>();
  const existsCache = new Map<string, boolean>();

  // Resolve the real project path once to check symlinks consistently
  let resolvedProjectPath: string | undefined;
  try {
    resolvedProjectPath = await realpath(projectPath);
  } catch {
    // Project path doesn't exist or can't be resolved - proceed without symlink checks
  }

  // Define readText as a standalone function so it can be referenced by readJson
  async function readText(relativePath: string): Promise<string | null> {
    if (textCache.has(relativePath)) {
      return textCache.get(relativePath) ?? null;
    }

    try {
      const fullPath = await validateRelativePath(projectPath, relativePath, resolvedProjectPath);
      const content = await readFile(fullPath, "utf8");
      textCache.set(relativePath, content);
      return content;
    } catch (error) {
      // Log specific errors for debugging (if DEBUG env var is set)
      if (process.env.DEBUG !== undefined && error instanceof Error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          console.error(`[DEBUG] Error reading ${relativePath}: ${error.message}`);
        }
      }
      textCache.set(relativePath, null);
      return null;
    }
  }

  return {
    readText,

    async readJson<T>(relativePath: string): Promise<T | null> {
      const cacheKey = relativePath;
      if (jsonCache.has(cacheKey)) {
        return jsonCache.get(cacheKey) as T | null;
      }

      const text = await readText(relativePath);
      if (text === null) {
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
        const fullPath = await validateRelativePath(projectPath, relativePath, resolvedProjectPath);
        await stat(fullPath);
        existsCache.set(relativePath, true);
        return true;
      } catch (error) {
        // Log specific errors for debugging (if DEBUG env var is set)
        if (process.env.DEBUG !== undefined && error instanceof Error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code !== "ENOENT") {
            console.error(`[DEBUG] Error checking ${relativePath}: ${error.message}`);
          }
        }
        existsCache.set(relativePath, false);
        return false;
      }
    },
  };
}
