/**
 * Issues List Screen
 *
 * Shows issues summary with options to view details or fix.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, action } from "../../cli-framework/index.js";
import { blank, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const issuesScreen: Screen<AppContext> = {
  id: "issues",
  parent: "home",

  render: (ctx) => {
    // Same summary as main screen
    const failed = ctx.allResults.filter((r) => r.status === "fail").length;
    const total = ctx.allResults.length;

    text(`\x1b[31mFailed checks ${failed}/${total}\x1b[0m`);
    blank();

    // Category breakdown
    const required = ctx.issues.filter((i) => i.tags.includes("required")).length;
    const recommended = ctx.issues.filter((i) => i.tags.includes("recommended")).length;
    const opinionated = ctx.issues.filter((i) =>
      !i.tags.includes("required") && !i.tags.includes("recommended")
    ).length;

    if (required > 0) {
      text(`  Required - ${required}`);
    }
    if (recommended > 0) {
      text(`  Recommended - ${recommended}`);
    }
    if (opinionated > 0) {
      text(`  Opinionated - ${opinionated}`);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    // Overview - detailed view of all issues
    opts.push(
      nav("overview", "Overview", "overview", {
        description: "Detailed view of all failed checks",
      })
    );

    // Fix issues - walk through queue
    opts.push(
      action("fix", "Fix issues", async (c) => {
        c.currentIssueIndex = 0;
        return "issue-detail";
      }, `Walk through ${ctx.issues.length} issue${ctx.issues.length > 1 ? "s" : ""} one by one`)
    );

    return opts;
  },
};
