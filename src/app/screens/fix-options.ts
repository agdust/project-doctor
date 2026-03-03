/**
 * Fix Options Screen
 *
 * Shows available fix options for an issue.
 */

import { bold, dim } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, blank, text, success, error } from "../../cli-framework/index.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const fixOptionsScreen: Screen<AppContext> = {
  id: SCREEN.fixOptions,
  parent: SCREEN.issueDetail,

  render: (ctx) => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (issue === undefined) {
      return;
    }

    text(bold(issue.name));
    text(dim(issue.result.message));
    blank();
    text("Choose a fix option:");
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (!issue?.fixOptions) {
      return [];
    }

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
            } catch (error_) {
              error(getErrorMessage(error_), 3);
            }
            blank();

            // After fixing, advance to next issue but navigate back to issue-detail
            c.currentIssueIndex++;
            if (c.currentIssueIndex >= c.issues.length) {
              return SCREEN.summary;
            }
            return SCREEN.issueDetail;
          },
          opt.description,
        ),
      );
    }

    return opts;
  },
};
