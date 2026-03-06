/**
 * Shared Check Utilities
 *
 * Common logic used by both CLI commands and interactive wizard.
 */

import {
  TAG,
  type CheckTag,
  type Check,
  type FixWithOptions,
  type ManualCheck,
  type ManualCheckState,
} from "../types.js";
import { toDateString } from "./dates.js";
import type { ProjectType, ResolvedConfig } from "../config/types.js";
import { isCheckOff, isTagOff, isGroupOff } from "../config/loader.js";
import {
  isMuteUntil,
  parseMuteUntil,
  isMuteUntilActive,
  extractSeverity,
} from "../config/severity.js";
import { checkGroups, listChecks, manualChecks } from "../registry.js";
import type { ManualCheckDisplayState } from "../app/types.js";
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
  "node-version",
  "deps",
  "knip",
  "bundle-size",
  "jscpd",
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
    // NOTE: for now project-doctor has no checks that are not applicable to js projects
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
    if (isMuteUntil(checkSeverity) && isMuteUntilActive(checkSeverity)) {
      const date = parseMuteUntil(checkSeverity);
      return {
        status: "muted",
        mutedUntil: date ? toDateString(date) : undefined,
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

/**
 * Check if a check is disabled by config at any level (check, tag, or group).
 *
 * Shared logic used by both the runner and fix command to avoid duplication.
 */
export function isCheckDisabledByConfig(
  checkName: string,
  checkTags: CheckTag[],
  groupName: string,
  config: ResolvedConfig,
): boolean {
  if (isCheckOff(config, checkName)) {
    return true;
  }
  for (const tag of checkTags) {
    if (isTagOff(config, tag)) {
      return true;
    }
  }
  if (isGroupOff(config, groupName)) {
    return true;
  }
  return false;
}

// ============================================================================
// Check Lookup
// ============================================================================

// Cached lookup structures (built lazily on first access)
let _validCheckNames: Set<string> | null = null;
let _validGroupNames: Set<string> | null = null;
let _validTagNames: Set<string> | null = null;
let _checkMap: Map<string, { check: Check; group: string }> | null = null;

function ensureCheckMap(): Map<string, { check: Check; group: string }> {
  if (_checkMap === null) {
    _checkMap = new Map();
    for (const group of checkGroups) {
      for (const check of group.checks) {
        _checkMap.set(check.name, { check: check as Check, group: group.name });
      }
    }
  }
  return _checkMap;
}

/** Get valid check names as a set */
export function getValidCheckNames(): Set<string> {
  if (_validCheckNames === null) {
    _validCheckNames = new Set(listChecks().map((c) => c.name));
  }
  return _validCheckNames;
}

/** Get valid group names as a set */
export function getValidGroupNames(): Set<string> {
  if (_validGroupNames === null) {
    _validGroupNames = new Set(checkGroups.map((g) => g.name));
  }
  return _validGroupNames;
}

/** Get all valid tag names from checks */
export function getValidTagNames(): Set<string> {
  if (_validTagNames === null) {
    const checks = listChecks();
    _validTagNames = new Set<string>();
    for (const check of checks) {
      for (const tag of check.tags) {
        _validTagNames.add(tag);
      }
    }
  }
  return _validTagNames;
}

/** Get valid manual check names as a set */
export function getValidManualCheckNames(): Set<string> {
  return new Set(manualChecks.map((c) => c.name));
}

/** Find a manual check by name */
export function findManualCheck(checkName: string): ManualCheck | null {
  return manualChecks.find((c) => c.name === checkName) ?? null;
}

/** Find a check by name, returns the check and its group */
export function findCheck(checkName: string): { check: Check; group: string } | null {
  return ensureCheckMap().get(checkName) ?? null;
}

/** Check if a fix has options (vs simple fix) */
export function isFixWithOptions<T>(fix: unknown): fix is FixWithOptions<T> {
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
 * A check is considered muted if it has an active "mute-until-YYYY-MM-DD" value.
 *
 * @param config - Resolved project configuration
 * @returns Number of muted checks
 */
export function countMutedChecks(config: ResolvedConfig): number {
  let count = 0;
  for (const check of Object.values(config.checks)) {
    const severity = extractSeverity(check);
    if (severity !== undefined && isMuteUntil(severity) && isMuteUntilActive(severity)) {
      count++;
    }
  }
  return count;
}

// ============================================================================
// Manual Check Display State
// ============================================================================

/**
 * Determine display state for a manual check based on config severity.
 * Disabled ("off") and muted ("mute-until-*") override the persisted state.
 */
export function getManualCheckDisplayState(
  check: ManualCheck,
  config: ResolvedConfig,
  state: ManualCheckState,
): ManualCheckDisplayState {
  // Check-level severity
  const checkSeverity = extractSeverity(config.checks[check.name]);
  if (checkSeverity === "off") {
    return "disabled";
  }
  if (checkSeverity !== undefined && isMuteUntilActive(checkSeverity)) {
    return "muted";
  }

  // Tag-level severity
  for (const tag of check.tags) {
    const tagSeverity = config.tags[tag];
    if (tagSeverity === "off") {
      return "disabled";
    }
    if (tagSeverity && isMuteUntilActive(tagSeverity)) {
      return "muted";
    }
  }

  return state === "done" ? "done" : "not-done";
}
