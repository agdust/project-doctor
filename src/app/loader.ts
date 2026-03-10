/**
 * App Data Loader
 *
 * Scans project, runs checks, and populates app context.
 */

import { TAG, type CheckResult } from "../types.js";
import { manualChecks } from "../registry.js";
import { createGlobalContext } from "../context/global.js";
import { sortFixableChecks } from "../utils/fix-chains.js";
import {
  loadWhyFromDocs,
  loadSourceUrlFromDocs,
  loadToolUrlFromDocs,
  getManualCheckDisplayState,
  extractManualCheckState,
} from "../utils/checks.js";
import { getProjectName } from "../utils/project-name.js";
import { loadAndRunChecks, extractFixableEntries } from "../utils/check-loader.js";
import type { AppContext, Issue, FailedCheck, FailedByCategory, ManualCheckItem } from "./types.js";

/**
 * Scan project and create initial app context
 */
export async function createAppContext(projectPath: string): Promise<AppContext> {
  const global = await createGlobalContext(projectPath);
  const projectName = await getProjectName(global, projectPath);

  const allResults: CheckResult[] = [];
  const failedChecks: FailedCheck[] = [];
  const allIssues: Issue[] = [];
  const failedByCategory: FailedByCategory = { required: 0, recommended: 0, opinionated: 0 };

  // Run all checks through the unified loader
  const { results, groups: groupResults } = await loadAndRunChecks(global);
  allResults.push(...results);

  // Extract fixable entries (bound fix callbacks) for lookup
  const fixEntries = extractFixableEntries(global, groupResults);
  const fixableByName = new Map(fixEntries.map((e) => [e.check.name, e]));

  // Enrich failed checks with docs and fix callbacks
  for (const groupResult of groupResults) {
    for (const { check, result } of groupResult.checkEntries) {
      if (result.status !== "fail") {
        continue;
      }

      // Count by category
      if (check.tags.includes(TAG.required)) {
        failedByCategory.required++;
      } else if (check.tags.includes(TAG.recommended)) {
        failedByCategory.recommended++;
      } else {
        failedByCategory.opinionated++;
      }

      // Load docs metadata for all failed checks
      const [why, sourceUrl, toolUrl] = await Promise.all([
        loadWhyFromDocs(groupResult.groupName, check.name),
        loadSourceUrlFromDocs(check.name),
        loadToolUrlFromDocs(check.name),
      ]);

      const fixEntry = fixableByName.get(check.name);

      const fixDescription = fixEntry?.fixDescription ?? check.fix?.description ?? null;

      // Build failed check for overview
      failedChecks.push({
        name: check.name,
        description: check.description,
        group: groupResult.groupName,
        tags: check.tags,
        message: result.message,
        why,
        sourceUrl,
        toolUrl,
        fixDescription,
        runFix: fixEntry?.runFix,
        fixOptions: fixEntry?.fixOptions,
      });

      // Build issue for the walk-through queue (all failed checks)
      allIssues.push({
        name: check.name,
        description: check.description,
        group: groupResult.groupName,
        tags: check.tags,
        result,
        fixDescription,
        why,
        sourceUrl,
        toolUrl,
        runFix: fixEntry?.runFix,
        fixOptions: fixEntry?.fixOptions,
      });
    }
  }

  // Sort by dependency chain and priority
  const sortedIssues = sortFixableChecks(allIssues);

  // Load manual check states from config
  const manualCheckItems: ManualCheckItem[] = manualChecks.map((check) => {
    const state = extractManualCheckState(global.config.manualChecks[check.name]);
    const displayState = getManualCheckDisplayState(check, global.config);
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
    selectedTag: "",
    stats: {
      fixed: 0,
      skipped: 0,
      muted: 0,
      disabled: 0,
    },
    scanned: true,
    historyEntries: [],
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
