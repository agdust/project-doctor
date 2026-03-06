/**
 * Issue Detail Screen
 *
 * Shows single issue with fix options.
 */

import { bold, dim, red, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import {
  action,
  nav,
  blank,
  title,
  muted,
  text,
  success,
  error,
  ICONS,
} from "../../cli-framework/index.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { moveToNextIssue, createMuteDisableActions } from "./shared.js";

export const issueDetailScreen: Screen<AppContext> = {
  id: SCREEN.issueDetail,
  parent: SCREEN.issues,

  render: (ctx) => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (issue === undefined) {
      title("No more issues");
      muted("All issues have been addressed.");
      blank();
      return;
    }

    const total = ctx.issues.length;
    const current = ctx.currentIssueIndex + 1;

    text(`${red(ICONS.fail)}  ${bold(issue.description)}  ${dim(`(${current}/${total})`)}`);
    muted(`   ${issue.name}`);
    text(`   ${issue.result.message}`);
    blank();
    text(`   ${cyan("Fix:")} ${issue.fixDescription}`);
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const issue = ctx.issues[ctx.currentIssueIndex];

    // No issue - show done
    if (issue === undefined) {
      return [
        action("done", "Done", () => {
          return SCREEN.home;
        }),
      ];
    }

    const opts: Option<AppContext>[] = [];

    // Fix options (multiple choices) or simple auto fix
    if (issue.fixOptions && issue.fixOptions.length > 0) {
      // Navigate to fix options submenu
      opts.push(
        nav("fix-options", "Fix...", SCREEN.fixOptions, {
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
            error(getErrorMessage(error_), 3);
          }
          blank();

          return moveToNextIssue(c);
        }),
      );
    }

    // Why? (if available)
    if (issue.why !== null) {
      opts.push(
        action(
          "why",
          "Why?",
          () => {
            return SCREEN.why;
          },
          "Learn why this check matters",
        ),
      );
    }

    // Next (skip without tracking)
    opts.push(
      action("next", "Next", (c) => {
        c.stats.skipped++;
        return moveToNextIssue(c);
      }),
      ...createMuteDisableActions({
        getCheckName: (c) => c.issues[c.currentIssueIndex].name,
        onComplete: (c) => moveToNextIssue(c),
      }),
    );

    return opts;
  },
};
