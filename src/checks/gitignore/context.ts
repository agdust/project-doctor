/**
 * Gitignore Context
 *
 * Uses the unified gitignore utility for proper pattern matching.
 */

import type { GlobalContext } from "../../types.js";
import { parseGitignore, type GitignoreInstance } from "../../utils/gitignore.js";

export interface GitignoreContext {
  /** The raw content of the .gitignore file (null if not found) */
  raw: string | null;
  /** The parsed gitignore instance for checking paths */
  gitignore: GitignoreInstance | null;
  /** Raw patterns from .gitignore (for checks that inspect the file itself) */
  patterns: string[];
}

/**
 * Extract patterns from raw .gitignore content.
 * Returns non-empty, non-comment lines.
 */
function extractPatterns(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

export async function loadContext(global: GlobalContext): Promise<GitignoreContext> {
  const raw = await global.files.readText(".gitignore");
  if (!raw) {
    return { raw: null, gitignore: null, patterns: [] };
  }

  return {
    raw,
    gitignore: parseGitignore(raw),
    patterns: extractPatterns(raw),
  };
}
