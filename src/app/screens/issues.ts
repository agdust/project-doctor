/**
 * Issues List Screen
 *
 * Shows issues summary with options to view details or fix.
 */

import { red } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, action } from "../../cli-framework/index.js";
import { blank, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const issuesScreen: Screen<AppContext> = {
  id: "issues",
  parent: "home",

  render: (ctx) => {
    // Total counts (all failed checks)
    const totalFailed = ctx.failedChecks.length;
    const totalFixable = ctx.issues.length;

    text(red(`Issues: ${totalFailed} (${totalFixable} auto-fixable)`));
    blank();

    // Category breakdown - all failed with fixable count
    const requiredAll = ctx.failedChecks.filter((c) => c.tags.includes("required")).length;
    const requiredFixable = ctx.issues.filter((i) => i.tags.includes("required")).length;

    const recommendedAll = ctx.failedChecks.filter((c) => c.tags.includes("recommended")).length;
    const recommendedFixable = ctx.issues.filter((i) => i.tags.includes("recommended")).length;

    const opinionatedAll = ctx.failedChecks.filter(
      (c) => !c.tags.includes("required") && !c.tags.includes("recommended"),
    ).length;
    const opinionatedFixable = ctx.issues.filter(
      (i) => !i.tags.includes("required") && !i.tags.includes("recommended"),
    ).length;

    if (requiredAll > 0) {
      text(`  Required - ${requiredAll} (${requiredFixable} auto-fixable)`);
    }
    if (recommendedAll > 0) {
      text(`  Recommended - ${recommendedAll} (${recommendedFixable} auto-fixable)`);
    }
    if (opinionatedAll > 0) {
      text(`  Opinionated - ${opinionatedAll} (${opinionatedFixable} auto-fixable)`);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    // Overview - detailed view of all failed checks (including non-fixable)
    const failedCount = ctx.failedChecks.length;
    opts.push(
      nav("overview", "Overview", "overview", {
        description: `All ${failedCount} failed check${failedCount !== 1 ? "s" : ""} (including non-fixable)`,
      }),
    );

    // Fix issues - walk through queue (only if there are fixable issues)
    if (ctx.issues.length > 0) {
      opts.push(
        action(
          "fix",
          "Fix issues",
          async (c) => {
            c.currentIssueIndex = 0;
            return "issue-detail";
          },
          `Walk through ${ctx.issues.length} issue${ctx.issues.length > 1 ? "s" : ""} one by one`,
        ),
      );
    }

    return opts;
  },
};
