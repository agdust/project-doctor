/**
 * Safe path utilities
 *
 * Provides path validation to prevent path traversal and symlink attacks.
 */

import { realpath, stat } from "node:fs/promises";
import { resolve, isAbsolute } from "node:path";

export type PathValidationResult = {
  valid: boolean;
  resolvedPath: string;
  error?: string;
};

/**
 * Validate and resolve a project path safely.
 *
 * - Resolves to absolute path
 * - Follows symlinks to get real path
 * - Validates it's a directory
 * - Prevents obvious path traversal attempts
 */
export async function validateProjectPath(inputPath: string): Promise<PathValidationResult> {
  try {
    // Resolve to absolute path
    const absolutePath = isAbsolute(inputPath) ? inputPath : resolve(inputPath);

    // Check for obvious path traversal patterns in the original input
    if (inputPath.includes("\0")) {
      return { valid: false, resolvedPath: "", error: "Invalid null byte in path" };
    }

    // Resolve symlinks to get real path
    const realPath = await realpath(absolutePath);

    // Verify it's a directory
    const stats = await stat(realPath);
    if (!stats.isDirectory()) {
      return { valid: false, resolvedPath: realPath, error: "Path is not a directory" };
    }

    return { valid: true, resolvedPath: realPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { valid: false, resolvedPath: "", error: `Path validation failed: ${message}` };
  }
}

/**
 * Validate that a file path is within a given base directory.
 * Prevents path traversal attacks when constructing file paths.
 */
export async function isPathWithinBase(filePath: string, basePath: string): Promise<boolean> {
  try {
    const realFilePath = await realpath(filePath);
    const realBasePath = await realpath(basePath);

    // Ensure the file path starts with the base path
    return realFilePath.startsWith(realBasePath + "/") || realFilePath === realBasePath;
  } catch {
    // If we can't resolve the paths, consider it unsafe
    return false;
  }
}
