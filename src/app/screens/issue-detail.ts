/**
 * Issue Detail Screen
 *
 * Shows single issue with fix options.
 */

import { bold, dim, red, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, nav, blank, title, muted, text, success, error  } from "../../cli-framework/index.js";
import { setCheckSeverity } from "../../config/loader.js";
import { createSkipUntil } from "../../config/types.js";
import type { AppContext } from "../types.js";

export const issueDetailScreen: Screen<AppContext> = {
  id: "issue-detail",
  parent: "issues",

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

    text(`${red("✗")}  ${bold(issue.name)}  ${dim(`(${current}/${total})`)}`);
    text(`   ${issue.result.message}`);
    blank();
    text(`   ${cyan("Fix:")} ${issue.fixDescription}`);
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const issue = ctx.issues[ctx.currentIssueIndex];

    // No issue - show done
    if (!issue) {
      return [
        action("done", "Done", () => {
          return "home";
        }),
      ];
    }

    const opts: Option<AppContext>[] = [];

    // Fix options (multiple choices) or simple auto fix
    if (issue.fixOptions && issue.fixOptions.length > 0) {
      // Navigate to fix options submenu
      opts.push(
        nav("fix-options", "Fix...", "fix-options", {
          description: "Choose from available fix options",
        }),
      );
    } else if (issue.runFix) {
      // Simple auto fix
      const runFix = issue.runFix;
      opts.push(
        action("fix", "Accept auto fix", async (c) => {
          try {
            const result = await runFix();
            blank();
            if (result.success) {
              success(result.message, 3);
              c.stats.fixed++;
            } else {
              error(result.message, 3);
            }
          } catch (error_) {
            error(error_ instanceof Error ? error_.message : "Unknown error", 3);
          }
          blank();

          return moveToNextIssue(c);
        }),
      );
    }

    // Why? (if available)
    if (issue.why) {
      opts.push(
        action(
          "why",
          "Why?",
          () => {
            return "why";
          },
          "Learn why this check matters",
        ),
      );
    }

    // Next (skip without tracking), Mute options, Disable
    opts.push(
      action("next", "Next", (c) => {
        c.stats.skipped++;
        return moveToNextIssue(c);
      }),
      action("mute-2w", "Mute for 2 weeks", async (c) => {
        try {
          const muteDate = new Date();
          muteDate.setDate(muteDate.getDate() + 14);
          await setCheckSeverity(c.projectPath, issue.name, createSkipUntil(muteDate));
          blank();
          muted("Muted for 2 weeks", 3);
          c.stats.muted++;
        } catch (error_) {
          error(error_ instanceof Error ? error_.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      }),
      action("mute-2m", "Mute for 2 months", async (c) => {
        try {
          const muteDate = new Date();
          muteDate.setMonth(muteDate.getMonth() + 2);
          await setCheckSeverity(c.projectPath, issue.name, createSkipUntil(muteDate));
          blank();
          muted("Muted for 2 months", 3);
          c.stats.muted++;
        } catch (error_) {
          error(error_ instanceof Error ? error_.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      }),
      action("disable", "Disable", async (c) => {
        try {
          await setCheckSeverity(c.projectPath, issue.name, "off");
          blank();
          muted("Disabled permanently", 3);
          c.stats.disabled++;
        } catch (error_) {
          error(error_ instanceof Error ? error_.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      }),
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
