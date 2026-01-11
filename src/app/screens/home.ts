/**
 * Home Screen
 *
 * Shows project health summary and main navigation options.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, action, separator } from "../../cli-framework/index.js";
import { blank, muted, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const homeScreen: Screen<AppContext> = {
  id: "home",
  // Root screen - no parent

  render: (ctx) => {
    // Project info
    muted(`Project: ${ctx.projectName}`);
    blank();

    // Failed checks summary
    const failed = ctx.allResults.filter((r) => r.status === "fail").length;
    const total = ctx.allResults.length;

    if (failed > 0) {
      text(`\x1b[31mFailed checks ${failed}/${total}\x1b[0m`);
    } else {
      text(`\x1b[32mAll checks passing (${total})\x1b[0m`);
    }
    blank();

    // Category breakdown (only show non-empty)
    if (failed > 0) {
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
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];
    const issueCount = ctx.issues.length;

    // Current issues (if any)
    if (issueCount > 0) {
      opts.push(
        nav("issues", "Current issues", "issues", {
          badge: `${issueCount}`,
        })
      );
    }

    // Config
    opts.push(
      nav("config", "Config", "config", {
        description: "Manage categories and checks",
      })
    );

    // Run checks again
    opts.push(
      action("rescan", "Run checks again", async () => {
        return "scanning";
      })
    );

    opts.push(separator());

    // Exit
    opts.push(
      action("exit", "Exit", async () => {
        return "__exit__";
      })
    );

    return opts;
  },
};
