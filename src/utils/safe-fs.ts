/**
 * Safe filesystem utilities
 *
 * Provides atomic file operations and line ending preservation.
 */

import { writeFile, rename, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Detect line ending style from content.
 * Returns "\r\n" for Windows (CRLF) or "\n" for Unix (LF).
 */
export function detectLineEnding(content: string): "\r\n" | "\n" {
  // Check for CRLF first (Windows)
  if (content.includes("\r\n")) {
    return "\r\n";
  }
  return "\n";
}

/**
 * Normalize line endings to the specified style.
 */
export function normalizeLineEndings(
  content: string,
  lineEnding: "\r\n" | "\n",
): string {
  // First normalize all to LF, then convert to target
  const normalized = content.replaceAll('\r\n', "\n");
  if (lineEnding === "\r\n") {
    return normalized.replaceAll('\n', "\r\n");
  }
  return normalized;
}

/**
 * Generate a temporary file path in the same directory as the target.
 * Using the same directory ensures atomic rename works (same filesystem).
 */
function getTempPath(targetPath: string): string {
  const dir = path.dirname(targetPath);
  const random = randomBytes(8).toString("hex");
  return path.join(dir, `.tmp-${random}`);
}

/**
 * Atomically write a file by writing to a temp file first, then renaming.
 * This prevents data loss if the write is interrupted.
 *
 * @param filePath - Target file path
 * @param content - Content to write
 * @param encoding - File encoding (default: utf-8)
 */
export async function atomicWriteFile(
  filePath: string,
  content: string,
  encoding: BufferEncoding = "utf8",
): Promise<void> {
  const tempPath = getTempPath(filePath);

  try {
    // Write to temp file
    await writeFile(tempPath, content, encoding);

    // Atomic rename (works on same filesystem)
    await rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Read a file, apply a transformation, and write it back atomically.
 * Preserves original line endings unless explicitly changed.
 *
 * @param filePath - File to transform
 * @param transform - Function to transform the content
 * @param options - Options for the operation
 */
export async function transformFile(
  filePath: string,
  transform: (content: string) => string,
  options: {
    /** Preserve original line endings (default: true) */
    preserveLineEndings?: boolean;
  } = {},
): Promise<void> {
  const { preserveLineEndings = true } = options;

  const original = await readFile(filePath, "utf8");
  const originalLineEnding = detectLineEnding(original);

  let transformed = transform(original);

  // Restore original line endings if requested
  if (preserveLineEndings) {
    transformed = normalizeLineEndings(transformed, originalLineEnding);
  }

  await atomicWriteFile(filePath, transformed);
}

/**
 * Read a file and return both content and detected line ending.
 * Useful when you need to process content and write back with same endings.
 */
export async function readFileWithLineEnding(
  filePath: string,
): Promise<{ content: string; lineEnding: "\r\n" | "\n" }> {
  const content = await readFile(filePath, "utf8");
  return {
    content,
    lineEnding: detectLineEnding(content),
  };
}
