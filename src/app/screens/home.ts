/**
 * Home Screen
 *
 * Shows project health summary and main navigation options.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, action, separator } from "../../cli-framework/index.js";
import { blank, title, muted, status } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const homeScreen: Screen<AppContext> = {
  id: "home",
  noBack: true, // Root screen

  render: (ctx) => {
    blank();
    title(`${ctx.projectName}`);
    muted("project-doctor");
    blank();

    // Health status
    const passed = ctx.allResults.filter((r) => r.status === "pass").length;
    const failed = ctx.allResults.filter((r) => r.status === "fail").length;
    const total = ctx.allResults.length;

    if (failed > 0) {
      status("fail", `${failed} issue${failed > 1 ? "s" : ""} found`, `${passed}/${total} checks passing`);
    } else {
      status("pass", "All checks passing", `${total} checks`);
    }

    // Fixable count
    const fixable = ctx.issues.length;
    if (fixable > 0) {
      status("info", `${fixable} auto-fixable`);
    }

    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];
    const issueCount = ctx.issues.length;

    // View issues (if any)
    if (issueCount > 0) {
      opts.push(
        nav("issues", "View issues", "issues", {
          badge: `${issueCount}`,
          description: "See all failing checks with auto-fixes",
        })
      );
    }

    // Fix all (if any)
    if (issueCount > 0) {
      opts.push(
        action("fix-all", "Fix all issues", async (c) => {
          // Navigate to first issue
          c.currentIssueIndex = 0;
          return "issue-detail";
        }, "Walk through each issue one by one")
      );
    }

    // Run checks again
    opts.push(
      action("rescan", "Run checks again", async () => {
        // Will re-run on next render cycle via onEnter
        return "scanning";
      }, "Re-scan project for issues")
    );

    opts.push(separator());

    // Exit
    opts.push(
      action("exit", "Exit", async () => {
        // Return special value to trigger exit
        return "__exit__";
      })
    );

    return opts;
  },
};
