/**
 * Shared Check Utilities
 *
 * Common logic used by both CLI commands and interactive wizard.
 */

import { TAG, type CheckTag, type Check, type FixResult, type GlobalContext } from "../types.js";
import type { ProjectType, ResolvedConfig } from "../config/types.js";
import { isTagOff, isGroupOff } from "../config/loader.js";
import { isSkipUntil, parseSkipUntil, isSkipUntilActive, extractSeverity } from "../config/types.js";
import { checkGroups, listChecks } from "../registry.js";
import { getWhyText as getWhyTextFromDocs } from "../docs/compiled-docs.js";

// ============================================================================
// Project Type Filtering
// ============================================================================

/** Groups that are specific to JS/Node projects */
export const JS_GROUPS = new Set([
  "package-json",
  "tsconfig",
  "eslint",
  "prettier",
  "npm",
  "deps",
  "testing",
  "bundle-size",
  "jscpd",
  "npm-security",
]);

/**
 * Check if a group applies to the given project type.
 *
 * @param groupName - Name of the check group
 * @param projectType - Project type: "js" or "generic"
 * @returns true if the group should run for this project type
 */
export function isGroupForProjectType(groupName: string, projectType: ProjectType): boolean {
  if (projectType === "js") {
    return true;
  }
  // For "generic" projects, skip JS-specific groups
  return !JS_GROUPS.has(groupName);
}

// ============================================================================
// Fix Priority
// ============================================================================

/**
 * Calculate fix priority score: lower = fix first.
 *
 * Formula: importance * 3 + effort
 * - importance: required=0, recommended=1, opinionated=2
 * - effort: low=0, medium=1, high=2
 *
 * This creates a priority curve that fixes important+easy issues first.
 *
 * @param tags - Tags of the check
 * @param rootTags - Tags of the chain root (for dependency chains)
 * @returns Priority score (0-8, lower = higher priority)
 */
export function getFixPriority(tags: CheckTag[], rootTags?: CheckTag[]): number {
  let importance = 2;
  if (tags.includes(TAG.required)) {
    importance = 0;
  } else if (tags.includes(TAG.recommended)) {
    importance = 1;
  }

  const effortTags = rootTags ?? tags;
  let effort = 2;
  if (effortTags.includes(TAG.effort.low)) {
    effort = 0;
  } else if (effortTags.includes(TAG.effort.medium)) {
    effort = 1;
  }

  return importance * 3 + effort;
}

// ============================================================================
// Check Status
// ============================================================================

export type CheckStatus = "enabled" | "disabled" | "muted";

export interface CheckStatusInfo {
  status: CheckStatus;
  mutedUntil?: string;
}

/**
 * Determine the effective status of a check based on config.
 *
 * Considers check-level, tag-level, and group-level configuration.
 *
 * @param checkName - Name of the check
 * @param checkTags - Tags associated with the check
 * @param groupName - Name of the group containing the check
 * @param config - Resolved project configuration
 * @returns Status info with mute expiry date if applicable
 */
export function getCheckStatus(
  checkName: string,
  checkTags: CheckTag[],
  groupName: string,
  config: ResolvedConfig,
): CheckStatusInfo {
  // Check if check is directly configured
  const checkSeverity = extractSeverity(config.checks[checkName]);
  if (checkSeverity !== undefined) {
    if (checkSeverity === "off") {
      return { status: "disabled" };
    }
    if (isSkipUntil(checkSeverity) && isSkipUntilActive(checkSeverity)) {
      const date = parseSkipUntil(checkSeverity);
      return {
        status: "muted",
        mutedUntil: date ? date.toISOString().split("T")[0] : undefined,
      };
    }
  }

  // Check if any tag is disabled
  for (const tag of checkTags) {
    if (isTagOff(config, tag)) {
      return { status: "disabled" };
    }
  }

  // Check if group is disabled
  if (isGroupOff(config, groupName)) {
    return { status: "disabled" };
  }

  return { status: "enabled" };
}

// ============================================================================
// Check Lookup
// ============================================================================

/** Get valid check names as a set */
export function getValidCheckNames(): Set<string> {
  return new Set(listChecks().map((c) => c.name));
}

/** Get valid group names as a set */
export function getValidGroupNames(): Set<string> {
  return new Set(checkGroups.map((g) => g.name));
}

/** Get all valid tag names from checks */
export function getValidTagNames(): Set<string> {
  const checks = listChecks();
  const tags = new Set<string>();
  for (const check of checks) {
    for (const tag of check.tags) {
      tags.add(tag);
    }
  }
  return tags;
}

/** Find a check by name, returns the check and its group */
export function findCheck(checkName: string): { check: Check; group: string } | null {
  for (const group of checkGroups) {
    const check = group.checks.find((c) => c.name === checkName);
    if (check) {
      return { check: check as Check, group: group.name };
    }
  }
  return null;
}

/** Check if a fix has options (vs simple fix) */
export function isFixWithOptions<T>(fix: unknown): fix is {
  description: string;
  options: {
    id: string;
    label: string;
    description?: string;
    run: (g: GlobalContext, c: T) => Promise<FixResult>;
  }[];
} {
  return (
    fix !== undefined &&
    fix !== null &&
    typeof fix === "object" &&
    "options" in fix &&
    Array.isArray((fix as { options: unknown[] }).options)
  );
}

// ============================================================================
// Check Info
// ============================================================================

export interface CheckInfo {
  name: string;
  group: string;
  description: string;
  tags: CheckTag[];
  status: CheckStatus;
  mutedUntil?: string;
  fixable: boolean;
  fixDescription?: string;
  fixOptions?: { id: string; label: string; description?: string }[];
}

/** Get full info about a check including status and fix options */
export function getCheckInfo(checkName: string, config: ResolvedConfig): CheckInfo | null {
  const found = findCheck(checkName);
  if (!found) {
    return null;
  }

  const { check, group } = found;
  const statusInfo = getCheckStatus(check.name, check.tags, group, config);

  const info: CheckInfo = {
    name: check.name,
    group,
    description: check.description,
    tags: check.tags,
    status: statusInfo.status,
    mutedUntil: statusInfo.mutedUntil,
    fixable: !!check.fix,
  };

  if (check.fix) {
    info.fixDescription = check.fix.description;

    if (isFixWithOptions(check.fix)) {
      info.fixOptions = check.fix.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        description: opt.description,
      }));
    }
  }

  return info;
}

/** Build a map of check names to their fixable status */
export function buildFixableMap(): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const group of checkGroups) {
    for (const check of group.checks) {
      map.set(check.name, !!check.fix);
    }
  }
  return map;
}

/** Build a map of check names to their tags */
export function buildTagsMap(): Map<string, CheckTag[]> {
  const map = new Map<string, CheckTag[]>();
  for (const group of checkGroups) {
    for (const check of group.checks) {
      map.set(check.name, check.tags);
    }
  }
  return map;
}

// ============================================================================
// Why/Docs Loading
// ============================================================================

/**
 * Load "Why" content from compiled docs manifest.
 *
 * Uses pre-compiled docs-manifest.json generated at build time.
 */
export async function loadWhyFromDocs(_group: string, checkName: string): Promise<string | null> {
  return getWhyTextFromDocs(checkName);
}

// ============================================================================
// Muted Checks Counter
// ============================================================================

/**
 * Count the number of currently muted checks in config.
 *
 * A check is considered muted if it has an active "skip-until-YYYY-MM-DD" value.
 *
 * @param config - Resolved project configuration
 * @returns Number of muted checks
 */
export function countMutedChecks(config: ResolvedConfig): number {
  let count = 0;
  for (const entry of Object.values(config.checks)) {
    const severity = extractSeverity(entry);
    if (severity !== undefined && isSkipUntil(severity) && isSkipUntilActive(severity)) {
      count++;
    }
  }
  return count;
}
