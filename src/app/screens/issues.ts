/**
 * Issues List Screen
 *
 * Shows issues summary with options to view details or fix.
 */

import { red } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, action, blank, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { TAG } from "../../types.js";

export const issuesScreen: Screen<AppContext> = {
  id: SCREEN.issues,
  parent: SCREEN.home,

  render: (ctx) => {
    // Total counts (all failed checks)
    const totalFailed = ctx.failedChecks.length;
    const totalFixable = ctx.issues.length;

    text(red(`Issues: ${totalFailed} (${totalFixable} auto-fixable)`));
    blank();

    // Category breakdown - all failed with fixable count
    const requiredAll = ctx.failedChecks.filter((c) => c.tags.includes(TAG.required)).length;
    const requiredFixable = ctx.issues.filter((i) => i.tags.includes(TAG.required)).length;

    const recommendedAll = ctx.failedChecks.filter((c) => c.tags.includes(TAG.recommended)).length;
    const recommendedFixable = ctx.issues.filter((i) => i.tags.includes(TAG.recommended)).length;

    const opinionatedAll = ctx.failedChecks.filter(
      (c) => !c.tags.includes(TAG.required) && !c.tags.includes(TAG.recommended),
    ).length;
    const opinionatedFixable = ctx.issues.filter(
      (i) => !i.tags.includes(TAG.required) && !i.tags.includes(TAG.recommended),
    ).length;

    if (requiredAll > 0) {
      text(`Required - ${requiredAll} (${requiredFixable} auto-fixable)`, 4);
    }
    if (recommendedAll > 0) {
      text(`Recommended - ${recommendedAll} (${recommendedFixable} auto-fixable)`, 4);
    }
    if (opinionatedAll > 0) {
      text(`Opinionated - ${opinionatedAll} (${opinionatedFixable} auto-fixable)`, 4);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    // Overview - detailed view of all failed checks (including non-fixable)
    const failedCount = ctx.failedChecks.length;
    opts.push(
      nav("overview", "Overview", SCREEN.overview, {
        description: `All ${failedCount} failed check${failedCount === 1 ? "" : "s"} (including non-fixable)`,
      }),
    );

    // Fix issues - walk through queue (only if there are fixable issues)
    if (ctx.issues.length > 0) {
      opts.push(
        action(
          "fix",
          "Fix issues",
          (c) => {
            c.currentIssueIndex = 0;
            return SCREEN.issueDetail;
          },
          `Walk through ${ctx.issues.length} issue${ctx.issues.length > 1 ? "s" : ""} one by one`,
        ),
      );
    }

    return opts;
  },
};
