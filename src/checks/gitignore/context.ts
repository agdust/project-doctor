import type { GlobalContext } from "../../types.js";

export interface GitignoreContext {
  raw: string | null;
  patterns: string[];
}

/**
 * Escape regex metacharacters in a string.
 * Used to safely convert gitignore patterns to regex.
 * Note: We escape * here, then convert \* back to .* for glob matching.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if a filename matches a gitignore pattern.
 * Safely handles glob patterns without ReDoS vulnerability.
 */
export function matchesPattern(pattern: string, filename: string): boolean {
  // Exact match
  if (pattern === filename) return true;

  // Only handle simple * wildcards safely
  if (!pattern.includes("*")) return false;

  // Escape regex metacharacters, then convert * to .*
  const escaped = escapeRegex(pattern);
  const regexPattern = escaped.replace(/\\\*/g, ".*");

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filename);
  } catch {
    // Invalid pattern - treat as no match
    return false;
  }
}

export async function loadContext(global: GlobalContext): Promise<GitignoreContext> {
  const raw = await global.files.readText(".gitignore");
  if (!raw) {
    return { raw: null, patterns: [] };
  }

  const patterns = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  return { raw, patterns };
}
