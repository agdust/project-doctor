/**
 * Unified Check Loader
 *
 * Single code path for iterating check groups, loading contexts,
 * filtering, and running checks. Used by CLI runner, app loader,
 * and fix command.
 */

import type { Check, CheckResult, CheckResultBase, CheckTag, GlobalContext } from "../types.js";
import { checkGroups } from "../registry.js";
import { isGroupOff } from "../config/loader.js";
import {
  isGroupForProjectType,
  isCheckDisabledByConfig,
  isToolDetectedForGroup,
  getToolDisplayName,
} from "./checks.js";
import { getErrorMessage } from "./errors.js";

export interface CheckLoadOptions {
  /** Only run these groups (CLI filter) */
  groups?: string[];
  /** Only run checks with these tags (CLI filter) */
  includeTags?: CheckTag[];
}

export interface CheckEntry {
  check: Check;
  result: CheckResult;
}

export interface GroupRunResult {
  groupName: string;
  /** null if context loading failed */
  groupContext: unknown;
  checkEntries: CheckEntry[];
}

export interface CheckLoadResult {
  results: CheckResult[];
  groups: GroupRunResult[];
}

export async function loadAndRunChecks(
  global: GlobalContext,
  options: CheckLoadOptions = {},
): Promise<CheckLoadResult> {
  const config = global.config;
  const allResults: CheckResult[] = [];
  const groups: GroupRunResult[] = [];

  // Determine which groups to run
  let groupsToRun = checkGroups;

  if (options.groups !== undefined && options.groups.length > 0) {
    // CLI filter: only run specified groups
    const groupsFilter = options.groups;
    groupsToRun = checkGroups.filter((g) => groupsFilter.includes(g.name));
  } else {
    // Config filter: skip groups turned off
    groupsToRun = checkGroups.filter((g) => !isGroupOff(config, g.name));
  }

  for (const group of groupsToRun) {
    // Skip groups not applicable to project type
    if (!isGroupForProjectType(group.name, config.projectType)) {
      continue;
    }

    // Skip groups when required tool is not detected
    if (!isToolDetectedForGroup(group.name, global.detected)) {
      const toolName = getToolDisplayName(group.name);
      const skipResult: CheckResult = {
        name: `${group.name}-not-detected`,
        group: group.name,
        status: "skip",
        message: `${toolName} not detected`,
      };
      allResults.push(skipResult);
      groups.push({
        groupName: group.name,
        groupContext: null,
        checkEntries: [],
      });
      continue;
    }

    // Load group context with error handling
    let groupContext: unknown;
    try {
      groupContext = await group.loadContext(global);
    } catch (error) {
      const groupResult: GroupRunResult = {
        groupName: group.name,
        groupContext: null,
        checkEntries: [],
      };
      for (const check of group.checks) {
        const result: CheckResult = {
          name: check.name,
          group: group.name,
          status: "fail",
          message: `Group context error: ${getErrorMessage(error)}`,
        };
        allResults.push(result);
        groupResult.checkEntries.push({ check: check as Check, result });
      }
      groups.push(groupResult);
      continue;
    }

    const groupResult: GroupRunResult = {
      groupName: group.name,
      groupContext,
      checkEntries: [],
    };

    for (const check of group.checks) {
      // Config-based filtering (check-level, tag-level, group-level)
      if (isCheckDisabledByConfig(check.name, check.tags, group.name, config)) {
        continue;
      }

      // CLI include tags filter
      const { includeTags } = options;
      if (includeTags && includeTags.length > 0) {
        const hasIncluded = check.tags.some((t) => includeTags.includes(t));
        if (!hasIncluded) {
          continue;
        }
      }

      // Run the check
      let baseResult: CheckResultBase;
      try {
        baseResult = await (
          check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase> | CheckResultBase
        )(global, groupContext);
      } catch (error) {
        baseResult = {
          name: check.name,
          status: "fail",
          message: `Error: ${getErrorMessage(error)}`,
        };
      }

      const result: CheckResult = { ...baseResult, group: group.name };
      allResults.push(result);
      groupResult.checkEntries.push({ check: check as Check, result });
    }

    groups.push(groupResult);
  }

  return { results: allResults, groups };
}
