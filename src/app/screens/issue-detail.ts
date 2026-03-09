/**
 * Issue Detail Screen
 *
 * Shows single issue with fix options.
 */

import { bold, dim, red, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, nav, blank, title, muted, text, ICONS } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import {
  moveToNextIssue,
  createMuteDisableActions,
  createCopyUrlActions,
  createFixHandler,
} from "./shared.js";

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
    muted(issue.name, 6);
    text(issue.result.message, 6);
    blank();
    text(`${cyan("Fix:")} ${issue.fixDescription}`, 6);
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
      opts.push(
        action(
          "fix",
          "Accept auto fix",
          createFixHandler({
            runFix: issue.runFix,
            getNextScreen: (c) => moveToNextIssue(c),
          }),
        ),
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

    opts.push(
      // Copy URL actions (tool docs, source reference)
      ...createCopyUrlActions(issue),

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
