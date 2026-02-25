/**
 * Unified gitignore handling using the 'ignore' library.
 *
 * This module provides a consistent interface for parsing .gitignore files
 * and checking if paths are ignored.
 *
 * @see https://github.com/kaelzhang/node-ignore
 */

import ignore, { type Ignore } from "ignore";

export interface GitignoreInstance {
  /** The raw content of the .gitignore file */
  raw: string;
  /** The parsed ignore instance */
  ig: Ignore;
  /** Check if a path is ignored */
  ignores: (path: string) => boolean;
  /** Check if any of the paths are ignored */
  ignoresAny: (paths: string[]) => boolean;
  /** Check if all of the paths are ignored */
  ignoresAll: (paths: string[]) => boolean;
  /** Filter paths, returning only ignored ones */
  filterIgnored: (paths: string[]) => string[];
  /** Filter paths, returning only non-ignored ones */
  filterNotIgnored: (paths: string[]) => string[];
}

/**
 * Parse a .gitignore file content and return an instance for checking paths.
 */
export function parseGitignore(content: string): GitignoreInstance {
  const ig = ignore().add(content);

  return {
    raw: content,
    ig,
    ignores: (path: string) => ig.ignores(path),
    ignoresAny: (paths: string[]) => paths.some((p) => ig.ignores(p)),
    ignoresAll: (paths: string[]) => paths.every((p) => ig.ignores(p)),
    filterIgnored: (paths: string[]) => paths.filter((p) => ig.ignores(p)),
    filterNotIgnored: (paths: string[]) => paths.filter((p) => !ig.ignores(p)),
  };
}

/**
 * Create an empty gitignore instance (ignores nothing).
 */
export function emptyGitignore(): GitignoreInstance {
  return parseGitignore("");
}

/**
 * Check if a single path would be ignored by the given .gitignore content.
 * Convenience function for simple one-off checks.
 */
export function isIgnored(gitignoreContent: string | null, path: string): boolean {
  if (gitignoreContent === null) {
    return false;
  }
  return parseGitignore(gitignoreContent).ignores(path);
}
