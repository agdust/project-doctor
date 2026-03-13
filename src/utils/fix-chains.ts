import type { CheckTag } from "../types.js";
import { getFixPriority } from "./checks.js";

/**
 * Fix dependency chains - defines the order in which related checks must be fixed.
 *
 * Each chain is an array of check names in dependency order.
 * Earlier checks must be fixed before later ones in the same chain.
 *
 * Example: ["size-limit-installed", "size-limit-configured", "size-limit-script"]
 * means size-limit-installed must be fixed before configured, and configured before script.
 */

export const fixChains: string[][] = [
  ["size-limit-installed", "size-limit-configured", "size-limit-script"],

  ["knip-installed", "knip-config"],

  [
    "node-version-nvmrc-exists",
    "node-version-nvmrc-valid-format",
    "node-version-nvmrc-modern-version",
  ],

  ["package-json-has-engines", "node-version-engines-valid", "node-version-engines-modern"],

  ["editorconfig-exists", "editorconfig-has-root"],
  ["editorconfig-exists", "editorconfig-has-indent"],

  ["env-example-exists", "env-example-not-empty"],

  ["prettier-config-exists", "prettier-ignore-exists"],

  ["eslint-config-exists", "eslint-flat-config"],

  ["tsconfig-exists", "tsconfig-strict-enabled"],
  ["tsconfig-exists", "tsconfig-no-unchecked-index"],
  ["tsconfig-exists", "tsconfig-verbatim-module-syntax"],
  ["tsconfig-exists", "tsconfig-skip-lib-check"],
  ["tsconfig-exists", "tsconfig-es-module-interop"],

  ["license-exists", "package-json-has-license"],

  // Package.json: existence is implicit (always exists for node projects)
  // but some fields depend on others
  ["package-json-has-name", "package-json-has-description"],
];

/**
 * Get the root dependency for a check (first element in its chain).
 * Returns the check itself if it has no dependencies.
 */
export function getChainRoot(checkName: string): string {
  for (const chain of fixChains) {
    const idx = chain.indexOf(checkName);
    if (idx > 0) {
      // Return the first element of this chain
      return chain[0];
    }
  }
  // No dependencies - this check is its own root
  return checkName;
}

/**
 * Get all checks that must be fixed before this check.
 */
export function getDependencies(checkName: string): string[] {
  const deps: string[] = [];

  for (const chain of fixChains) {
    const idx = chain.indexOf(checkName);
    if (idx > 0) {
      // All checks before this one in the chain are dependencies
      deps.push(...chain.slice(0, idx));
    }
  }

  return [...new Set(deps)]; // Remove duplicates
}

/**
 * Check if checkA must come before checkB based on chains.
 * Returns: -1 if A before B, 1 if B before A, 0 if no relationship
 */
export function compareByChain(checkA: string, checkB: string): number {
  // Check if B depends on A (A must come first)
  const bDeps = getDependencies(checkB);
  if (bDeps.includes(checkA)) {
    return -1;
  }

  // Check if A depends on B (B must come first)
  const aDeps = getDependencies(checkA);
  if (aDeps.includes(checkB)) {
    return 1;
  }

  // No dependency relationship
  return 0;
}

/**
 * Sort checks respecting dependency chains then by priority.
 * Uses topological sort concepts to ensure dependencies come first.
 */
export function sortByChainAndPriority<T extends { name: string }>(
  checks: T[],
  getPriority: (check: T) => number,
): T[] {
  // Build dependency depth for each check
  const depthCache = new Map<string, number>();

  function getDepth(checkName: string): number {
    const cached = depthCache.get(checkName);
    if (cached !== undefined) {
      return cached;
    }

    const deps = getDependencies(checkName);
    if (deps.length === 0) {
      depthCache.set(checkName, 0);
      return 0;
    }

    const maxDepth = Math.max(...deps.map((d) => getDepth(d))) + 1;
    depthCache.set(checkName, maxDepth);
    return maxDepth;
  }

  // Calculate depths for all checks
  for (const check of checks) {
    getDepth(check.name);
  }

  // Sort: first by depth (dependencies first), then by priority
  return [...checks].toSorted((a, b) => {
    const depthA = depthCache.get(a.name) ?? 0;
    const depthB = depthCache.get(b.name) ?? 0;

    if (depthA !== depthB) {
      return depthA - depthB;
    }

    return getPriority(a) - getPriority(b);
  });
}

/**
 * Sort fixable checks by chain dependencies and priority.
 * Uses chain root tags to calculate priority (so dependent checks inherit their root's priority).
 */
export function sortFixableChecks<T extends { name: string; tags: CheckTag[] }>(checks: T[]): T[] {
  // Build tag map for chain root lookups
  const tagsByName = new Map<string, CheckTag[]>();
  for (const check of checks) {
    tagsByName.set(check.name, check.tags);
  }

  // Sort by dependency chain and priority
  return sortByChainAndPriority(checks, (check) => {
    const rootName = getChainRoot(check.name);
    const rootTags = tagsByName.get(rootName) ?? check.tags;
    return getFixPriority(check.tags, rootTags);
  });
}
