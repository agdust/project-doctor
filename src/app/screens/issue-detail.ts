/**
 * Issue Detail Screen
 *
 * Shows single issue with fix options.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, title, muted, text, success, error } from "../../cli-framework/index.js";
import { setCheckSeverity } from "../../config/loader.js";
import { createSkipUntil } from "../../config/types.js";
import type { AppContext } from "../types.js";

export const issueDetailScreen: Screen<AppContext> = {
  id: "issue-detail",

  render: (ctx) => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (!issue) {
      title("No more issues");
      muted("All issues have been addressed.");
      blank();
      return;
    }

    const total = ctx.issues.length;
    const current = ctx.currentIssueIndex + 1;

    text(`\x1b[31m✗\x1b[0m  \x1b[1m${issue.name}\x1b[0m  \x1b[90m(${current}/${total})\x1b[0m`);
    text(`   ${issue.result.message}`);
    blank();
    text(`   \x1b[36mFix:\x1b[0m ${issue.fixDescription}`);
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const issue = ctx.issues[ctx.currentIssueIndex];

    // No issue - show done
    if (!issue) {
      return [
        action("done", "Done", async () => {
          return "home";
        }),
      ];
    }

    const opts: Option<AppContext>[] = [];

    // Accept auto fix
    opts.push(
      action("fix", "Accept auto fix", async (c) => {
        try {
          const result = await issue.runFix();
          blank();
          if (result.success) {
            success(result.message, 3);
            c.stats.fixed++;
          } else {
            error(result.message, 3);
          }
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      })
    );

    // Why? (if available)
    if (issue.why) {
      opts.push(
        action("why", "Why?", async () => {
          return "why";
        }, "Learn why this check matters")
      );
    }

    // Next (skip without tracking)
    opts.push(
      action("next", "Next", async (c) => {
        c.stats.skipped++;
        return moveToNextIssue(c);
      })
    );

    // Mute for 2 weeks
    opts.push(
      action("mute-2w", "Mute for 2 weeks", async (c) => {
        try {
          const muteDate = new Date();
          muteDate.setDate(muteDate.getDate() + 14);
          await setCheckSeverity(c.projectPath, issue.name, createSkipUntil(muteDate));
          blank();
          muted("Muted for 2 weeks", 3);
          c.stats.muted++;
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      })
    );

    // Mute for 2 months
    opts.push(
      action("mute-2m", "Mute for 2 months", async (c) => {
        try {
          const muteDate = new Date();
          muteDate.setMonth(muteDate.getMonth() + 2);
          await setCheckSeverity(c.projectPath, issue.name, createSkipUntil(muteDate));
          blank();
          muted("Muted for 2 months", 3);
          c.stats.muted++;
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      })
    );

    // Disable check permanently
    opts.push(
      action("disable", "Disable", async (c) => {
        try {
          await setCheckSeverity(c.projectPath, issue.name, "off");
          blank();
          muted("Disabled permanently", 3);
          c.stats.disabled++;
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      })
    );

    return opts;
  },
};

function moveToNextIssue(ctx: AppContext): string | undefined {
  ctx.currentIssueIndex++;

  if (ctx.currentIssueIndex >= ctx.issues.length) {
    // All done - show summary and go home
    return "summary";
  }

  // Stay on issue-detail for next issue (re-render)
  return undefined;
}
