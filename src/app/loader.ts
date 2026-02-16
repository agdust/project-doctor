/**
 * App Data Loader
 *
 * Scans project, runs checks, and populates app context.
 */

import type { CheckResult, CheckResultBase, GlobalContext, CheckTag, FixResult } from "../types.js";
import { checkGroups } from "../registry.js";
import { createGlobalContext } from "../context/global.js";
import { sortByChainAndPriority, getChainRoot } from "../utils/fix-chains.js";
import { getFixPriority, isGroupForProjectType, loadWhyFromDocs } from "../utils/checks.js";
import type { AppContext, FixableIssue, FailedCheck, FailedByCategory } from "./types.js";

/**
 * Get project name from package.json or folder
 */
async function getProjectName(global: GlobalContext, projectPath: string): Promise<string> {
  try {
    const pkgContent = await global.files.readText("package.json");
    if (pkgContent) {
      const pkg = JSON.parse(pkgContent) as { name?: string };
      if (typeof pkg.name === "string") return pkg.name;
    }
  } catch {
    // Use folder name
  }
  return projectPath.split("/").pop() ?? "project";
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
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      const baseResult = await (
        check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>
      )(global, groupContext);

      const result: CheckResult = { ...baseResult, group: group.name };
      allResults.push(result);

      // Track failed checks
      if (baseResult.status === "fail") {
        // Count by category
        if (check.tags.includes("required")) {
          failedByCategory.required++;
        } else if (check.tags.includes("recommended")) {
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
                (opt.run as (g: GlobalContext, c: unknown) => Promise<FixResult>)(
                  global,
                  groupContext,
                ),
            }));
          } else {
            failedCheck.runFix = () =>
              (fix.run as (g: GlobalContext, c: unknown) => Promise<FixResult>)(
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
}
