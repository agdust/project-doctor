/**
 * App Data Loader
 *
 * Scans project, runs checks, and populates app context.
 */

import path from "node:path";
import {
  TAG,
  type CheckResult,
  type CheckResultBase,
  type GlobalContext,
  type CheckTag,
  type FixResult,
  type ManualCheck,
  type ManualCheckState,
} from "../types.js";
import { checkGroups, manualChecks } from "../registry.js";
import { createGlobalContext } from "../context/global.js";
import { sortByChainAndPriority, getChainRoot } from "../utils/fix-chains.js";
import { getFixPriority, isGroupForProjectType, loadWhyFromDocs } from "../utils/checks.js";
import { isSkipUntilActive, extractSeverity } from "../config/types.js";
import type {
  ManualCheckDisplayState,
  AppContext,
  FixableIssue,
  FailedCheck,
  FailedByCategory,
  ManualCheckItem,
} from "./types.js";
import { safeJsonParse } from "../utils/safe-json.js";

/**
 * Get project name from package.json or folder
 */
async function getProjectName(global: GlobalContext, projectPath: string): Promise<string> {
  const pkgContent = await global.files.readText("package.json");
  if (pkgContent !== null) {
    const pkg = safeJsonParse<{ name?: string }>(pkgContent);
    if (pkg && typeof pkg.name === "string") {
      return pkg.name;
    }
  }
  return path.basename(projectPath) || "project";
}

/**
 * Determine display state for a manual check based on config severity.
 * Disabled ("off") and muted ("skip-until-*") override the persisted state.
 */
function getManualCheckDisplayState(
  check: ManualCheck,
  config: GlobalContext["config"],
  state: ManualCheckState,
): ManualCheckDisplayState {
  // Check-level severity
  const checkSeverity = extractSeverity(config.checks[check.name]);
  if (checkSeverity === "off") {
    return "disabled";
  }
  if (checkSeverity !== undefined && isSkipUntilActive(checkSeverity)) {
    return "muted";
  }

  // Tag-level severity
  for (const tag of check.tags) {
    const tagSeverity = config.tags[tag];
    if (tagSeverity === "off") {
      return "disabled";
    }
    if (tagSeverity && isSkipUntilActive(tagSeverity)) {
      return "muted";
    }
  }

  return state === "done" ? "done" : "not-done";
}

/**
 * Scan project and create initial app context
 */
export async function createAppContext(projectPath: string): Promise<AppContext> {
  const global = await createGlobalContext(projectPath);
  const projectName = await getProjectName(global, projectPath);

  const allResults: CheckResult[] = [];
  const failedChecks: FailedCheck[] = [];
  const fixableIssues: FixableIssue[] = [];
  const failedByCategory: FailedByCategory = { required: 0, recommended: 0, opinionated: 0 };

  // Filter groups based on project type
  const groupsToRun = checkGroups.filter((g) =>
    isGroupForProjectType(g.name, global.config.projectType),
  );

  // Run all checks
  for (const group of groupsToRun) {
    let groupContext: unknown;
    try {
      groupContext = await group.loadContext(global);
    } catch (error) {
      // If group context loading fails, mark all checks in group as failed
      for (const check of group.checks) {
        const result: CheckResult = {
          name: check.name,
          group: group.name,
          status: "fail",
          message: `Group context error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
        allResults.push(result);
      }
      continue;
    }

    for (const check of group.checks) {
      let baseResult: CheckResultBase;
      try {
        baseResult = await (
          check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase> | CheckResultBase
        )(global, groupContext);
      } catch (error) {
        // Convert thrown errors to failed check results
        baseResult = {
          name: check.name,
          status: "fail",
          message: `Check error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }

      const result: CheckResult = { ...baseResult, group: group.name };
      allResults.push(result);

      // Track failed checks
      if (baseResult.status === "fail") {
        // Count by category
        if (check.tags.includes(TAG.required)) {
          failedByCategory.required++;
        } else if (check.tags.includes(TAG.recommended)) {
          failedByCategory.recommended++;
        } else {
          failedByCategory.opinionated++;
        }

        // Load why content for all failed checks
        const why = await loadWhyFromDocs(group.name, check.name);

        // Build failed check with full info
        const failedCheck: FailedCheck = {
          name: check.name,
          group: group.name,
          tags: check.tags,
          message: baseResult.message,
          why,
          fixDescription: check.fix?.description ?? null,
        };

        // Add fix info if available
        if (check.fix) {
          const fix = check.fix;
          if ("options" in fix) {
            failedCheck.fixOptions = fix.options.map((opt) => ({
              id: opt.id,
              label: opt.label,
              description: opt.description,
              runFix: () =>
                (opt.run as (g: GlobalContext, c: unknown) => Promise<FixResult> | FixResult)(
                  global,
                  groupContext,
                ),
            }));
          } else {
            failedCheck.runFix = () =>
              (fix.run as (g: GlobalContext, c: unknown) => Promise<FixResult> | FixResult)(
                global,
                groupContext,
              );
          }
        }

        failedChecks.push(failedCheck);

        // Collect fixable failures (for the fixing flow)
        if (check.fix) {
          const fix = check.fix;
          if ("options" in fix) {
            fixableIssues.push({
              name: check.name,
              group: group.name,
              tags: check.tags,
              result,
              fixDescription: fix.description,
              why,
              fixOptions: failedCheck.fixOptions,
            });
          } else {
            fixableIssues.push({
              name: check.name,
              group: group.name,
              tags: check.tags,
              result,
              fixDescription: fix.description,
              why,
              runFix: failedCheck.runFix,
            });
          }
        }
      }
    }
  }

  // Build tag map for chain root lookups
  const tagsByName = new Map<string, CheckTag[]>();
  for (const issue of fixableIssues) {
    tagsByName.set(issue.name, issue.tags);
  }

  // Sort by dependency chain and priority
  const sortedIssues = sortByChainAndPriority(fixableIssues, (issue) => {
    const rootName = getChainRoot(issue.name);
    const rootTags = tagsByName.get(rootName) ?? issue.tags;
    return getFixPriority(issue.tags, rootTags);
  });

  // Load manual check states from config
  const manualCheckItems: ManualCheckItem[] = manualChecks.map((check) => {
    const state = global.config.manualChecks[check.name] ?? "not-done";
    const displayState = getManualCheckDisplayState(check, global.config, state);
    return { check, state, displayState };
  });

  return {
    projectPath,
    projectName,
    global,
    allResults,
    failedChecks,
    failedByCategory,
    issues: sortedIssues,
    currentIssueIndex: 0,
    selectedOverviewIndex: 0,
    manualCheckItems,
    selectedManualCheckIndex: 0,
    stats: {
      fixed: 0,
      skipped: 0,
      muted: 0,
      disabled: 0,
    },
    scanned: true,
  };
}

/**
 * Re-scan after fixes to update results
 */
export async function rescanProject(ctx: AppContext): Promise<void> {
  const newCtx = await createAppContext(ctx.projectPath);
  ctx.global = newCtx.global;
  ctx.allResults = newCtx.allResults;
  ctx.failedChecks = newCtx.failedChecks;
  ctx.failedByCategory = newCtx.failedByCategory;
  ctx.issues = newCtx.issues;
  ctx.currentIssueIndex = 0;
  ctx.manualCheckItems = newCtx.manualCheckItems;
}
