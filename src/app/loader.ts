/**
 * App Data Loader
 *
 * Scans project, runs checks, and populates app context.
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CheckResult, CheckResultBase, GlobalContext, CheckTag } from "../types.js";
import { checkGroups } from "../registry.js";
import { createGlobalContext } from "../context/global.js";
import { sortByChainAndPriority, getChainRoot } from "../utils/fix-chains.js";
import type { AppContext, FixableIssue, FailedByCategory } from "./types.js";

// Package paths for loading docs
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, "..", "..");
const CHECKS_SRC = join(PACKAGE_ROOT, "src", "checks");

/**
 * Priority scoring: lower = fix first
 * importance (required=0, recommended=1, opinionated=2) * 3 + effort (low=0, med=1, high=2)
 */
function getFixPriority(tags: CheckTag[], rootTags?: CheckTag[]): number {
  const importance = tags.includes("required") ? 0
    : tags.includes("recommended") ? 1 : 2;

  const effortTags = rootTags ?? tags;
  const effort = effortTags.includes("effort:low") ? 0
    : effortTags.includes("effort:medium") ? 1 : 2;

  return importance * 3 + effort;
}

/**
 * Load "Why" content from check's docs.md
 */
async function loadWhyFromDocs(group: string, checkName: string): Promise<string | null> {
  const checkFolder = checkName.startsWith(`${group}-`)
    ? checkName.slice(group.length + 1)
    : checkName;

  const docsPath = join(CHECKS_SRC, group, checkFolder, "docs.md");

  try {
    const content = await readFile(docsPath, "utf-8");
    const whyMatch = content.match(/## Why\n\n([\s\S]*?)(?=\n## |$)/);
    if (whyMatch) {
      return whyMatch[1].trim();
    }
  } catch {
    // No docs file
  }

  return null;
}

/**
 * Get project name from package.json or folder
 */
async function getProjectName(global: GlobalContext, projectPath: string): Promise<string> {
  try {
    const pkgContent = await global.files.readText("package.json");
    if (pkgContent) {
      const pkg = JSON.parse(pkgContent);
      if (pkg.name) return pkg.name;
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
  const fixableIssues: FixableIssue[] = [];
  const failedByCategory: FailedByCategory = { required: 0, recommended: 0, opinionated: 0 };

  // Run all checks
  for (const group of checkGroups) {
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      const baseResult = await (check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>)(
        global,
        groupContext
      );

      const result: CheckResult = { ...baseResult, group: group.name };
      allResults.push(result);

      // Track failed checks by category
      if (baseResult.status === "fail") {
        if (check.tags.includes("required")) {
          failedByCategory.required++;
        } else if (check.tags.includes("recommended")) {
          failedByCategory.recommended++;
        } else {
          failedByCategory.opinionated++;
        }

        // Collect fixable failures
        if (check.fix) {
          const why = await loadWhyFromDocs(group.name, check.name);
          fixableIssues.push({
            name: check.name,
            group: group.name,
            tags: check.tags,
            result,
            fixDescription: check.fix.description,
            why,
            runFix: () => (check.fix as { run: (g: GlobalContext, c: unknown) => Promise<{ success: boolean; message: string }> }).run(global, groupContext),
          });
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
    failedByCategory,
    issues: sortedIssues,
    currentIssueIndex: 0,
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
  ctx.allResults = newCtx.allResults;
  ctx.failedByCategory = newCtx.failedByCategory;
  ctx.issues = newCtx.issues;
  ctx.currentIssueIndex = 0;
}
