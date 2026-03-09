/**
 * Overview Detail Screen
 *
 * Shows detailed information about a selected failed check.
 */

import { bold, red, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, text, muted, ICONS } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { TAG } from "../../types.js";
import { createCopyUrlActions, createFixHandler } from "./shared.js";

export const overviewDetailScreen: Screen<AppContext> = {
  id: SCREEN.overviewDetail,
  parent: SCREEN.overview,

  render: (ctx) => {
    const check = ctx.failedChecks[ctx.selectedOverviewIndex];
    if (check === undefined) {
      muted("Check not found");
      blank();
      return;
    }

    // Check title and status
    text(`${red(ICONS.fail)}  ${bold(check.description)}`);
    muted(check.name, 6);
    text(check.message, 6);
    blank();

    // Why section
    if (check.why !== null) {
      text(bold("Why this matters"));
      blank();
      // Indent and wrap the why text
      const lines = check.why.split("\n");
      for (const line of lines) {
        text(line, 6);
      }
      blank();
    }

    // Fix available
    if (check.fixDescription !== null) {
      text(`${cyan("Fix available:")} ${check.fixDescription}`);
      blank();
    }

    // Tool/source links
    if (check.toolUrl !== null) {
      muted(`Documentation: ${check.toolUrl}`);
      blank();
    }
    if (check.sourceUrl !== null) {
      muted(`Source: ${check.sourceUrl}`);
      blank();
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const check = ctx.failedChecks[ctx.selectedOverviewIndex];
    if (check === undefined) {
      return [];
    }

    const opts: Option<AppContext>[] = [];

    // Helper to remove fixed check from lists
    const removeFixedCheck = (c: AppContext) => {
      const checkToRemove = c.failedChecks[c.selectedOverviewIndex];
      if (checkToRemove === undefined) {
        return;
      }

      // Update category counts
      if (checkToRemove.tags.includes(TAG.required)) {
        c.failedByCategory.required--;
      } else if (checkToRemove.tags.includes(TAG.recommended)) {
        c.failedByCategory.recommended--;
      } else {
        c.failedByCategory.opinionated--;
      }

      // Remove from failedChecks
      c.failedChecks.splice(c.selectedOverviewIndex, 1);

      // Adjust selected index if needed
      if (c.selectedOverviewIndex >= c.failedChecks.length) {
        c.selectedOverviewIndex = Math.max(0, c.failedChecks.length - 1);
      }
    };

    // Fix options if available
    if (check.fixOptions && check.fixOptions.length > 0) {
      opts.push(separator("Fix options"));
      for (const opt of check.fixOptions) {
        opts.push(
          action(
            opt.id,
            opt.label,
            createFixHandler({
              runFix: opt.runFix,
              onSuccess: removeFixedCheck,
              getNextScreen: () => SCREEN.overview,
            }),
            opt.description,
          ),
        );
      }
    } else if (check.runFix) {
      const runFix = check.runFix;
      opts.push(
        action(
          "fix",
          "Apply fix",
          createFixHandler({
            runFix,
            onSuccess: removeFixedCheck,
            getNextScreen: () => SCREEN.overview,
          }),
          check.fixDescription ?? undefined,
        ),
      );
    }

    // Copy URL actions (tool docs, source reference)
    opts.push(...createCopyUrlActions(check));

    return opts;
  },
};
