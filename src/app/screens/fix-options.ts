/**
 * Fix Options Screen
 *
 * Shows available fix options for an issue.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, text, success, error } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const fixOptionsScreen: Screen<AppContext> = {
  id: "fix-options",
  parent: "issue-detail",

  render: (ctx) => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (!issue) return;

    text(`\x1b[1m${issue.name}\x1b[0m`);
    text(`\x1b[90m${issue.result.message}\x1b[0m`);
    blank();
    text("Choose a fix option:");
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (!issue?.fixOptions) return [];

    const opts: Option<AppContext>[] = [];

    for (const opt of issue.fixOptions) {
      opts.push(
        action(opt.id, opt.label, async (c) => {
          try {
            const result = await opt.runFix();
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
        }, opt.description)
      );
    }

    return opts;
  },
};

function moveToNextIssue(ctx: AppContext): string | undefined {
  ctx.currentIssueIndex++;

  if (ctx.currentIssueIndex >= ctx.issues.length) {
    return "summary";
  }

  return "issue-detail";
}
