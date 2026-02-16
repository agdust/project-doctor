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
  // Bundle size: install tool → configure → add script
  ["size-limit-installed", "size-limit-configured", "size-limit-script"],

  // Knip: install tool → configure
  ["knip-installed", "knip-config"],

  // nvmrc: create file → valid format → modern version
  ["npm-nvmrc-exists", "npm-nvmrc-valid-format", "npm-nvmrc-modern-version"],

  // engines: add field → valid format → modern version
  ["npm-engines-exists", "npm-engines-valid", "npm-engines-modern"],

  // editorconfig: create file → add settings
  ["editorconfig-exists", "editorconfig-has-root"],
  ["editorconfig-exists", "editorconfig-has-indent"],

  // README: create file → add sections
  ["readme-exists", "readme-has-title"],
  ["readme-exists", "readme-has-install-section"],
  ["readme-exists", "readme-has-usage-section"],

  // env: create file → add content
  ["env-example-exists", "env-example-not-empty"],

  // prettier: config → ignore (optional dependency)
  ["prettierrc-exists", "prettier-ignore-exists"],

  // ESLint: config → flat config migration
  ["eslint-config-exists", "eslint-flat-config"],

  // TypeScript: config exists → strict settings
  ["tsconfig-exists", "tsconfig-strict-enabled"],
  ["tsconfig-exists", "tsconfig-no-unchecked-index"],
  ["tsconfig-exists", "tsconfig-verbatim-module-syntax"],
  ["tsconfig-exists", "tsconfig-skip-lib-check"],
  ["tsconfig-exists", "tsconfig-es-module-interop"],

  // Package.json: existence is implicit (always exists for node projects)
  // but some fields depend on others
  ["package-json-has-name", "package-json-has-description"],
];

/**
 * Build a map of check name → chain position for efficient lookup.
 * Returns { checkName: { chainIndex: number, position: number } }
 */
export function buildChainIndex(): Map<
  string,
  { chainIndex: number; position: number }
> {
  const index = new Map<string, { chainIndex: number; position: number }>();

  fixChains.forEach((chain, chainIndex) => {
    chain.forEach((checkName, position) => {
      // If a check appears in multiple chains, use the one where it appears earliest
      // (i.e., where it has the most dependencies)
      const existing = index.get(checkName);
      if (!existing || position > existing.position) {
        index.set(checkName, { chainIndex, position });
      }
    });
  });

  return index;
}

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
  if (bDeps.includes(checkA)) return -1;

  // Check if A depends on B (B must come first)
  const aDeps = getDependencies(checkA);
  if (aDeps.includes(checkB)) return 1;

  // No dependency relationship
  return 0;
}

/**
 * Sort checks respecting dependency chains then by priority.
 * Uses topological sort concepts to ensure dependencies come first.
 */
export function sortByChainAndPriority<T extends { name: string }>(
  checks: T[],
  getPriority: (check: T) => number
): T[] {
  // Build dependency depth for each check
  const depthCache = new Map<string, number>();

  function getDepth(checkName: string): number {
    if (depthCache.has(checkName)) {
      return depthCache.get(checkName)!;
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
  return [...checks].sort((a, b) => {
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
