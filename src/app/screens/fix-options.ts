/**
 * Fix Options Screen
 *
 * Shows available fix options for an issue.
 */

import { bold, dim } from "../../utils/colors.js";
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

    text(bold(issue.name));
    text(dim(issue.result.message));
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
        action(
          opt.id,
          opt.label,
          async (c) => {
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
          },
          opt.description,
        ),
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
