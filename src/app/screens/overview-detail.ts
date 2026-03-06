/**
 * Overview Detail Screen
 *
 * Shows detailed information about a selected failed check.
 */

import { bold, red, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import {
  action,
  separator,
  blank,
  text,
  muted,
  success,
  error,
  ICONS,
} from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { TAG, type CheckTag } from "../../types.js";
import { getErrorMessage } from "../../utils/errors.js";
import { copyToClipboard } from "../../utils/clipboard.js";

// Tool documentation links
const TOOL_DOCS: Record<string, string> = {
  eslint: "https://eslint.org/docs/latest/",
  prettier: "https://prettier.io/docs/en/",
  typescript: "https://www.typescriptlang.org/docs/",
  vitest: "https://vitest.dev/guide/",
  knip: "https://knip.dev/",
  jscpd: "https://github.com/kucherenko/jscpd",
};

function getToolLink(tags: CheckTag[]): { tool: string; url: string } | null {
  for (const tag of tags) {
    if (tag.startsWith("tool:")) {
      const tool = tag.slice(5);
      const url = TOOL_DOCS[tool];
      if (url) {
        return { tool, url };
      }
    }
  }
  return null;
}

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
    muted(`   ${check.name}`);
    text(`   ${check.message}`);
    blank();

    // Why section
    if (check.why !== null) {
      text(bold("Why this matters"));
      blank();
      // Indent and wrap the why text
      const lines = check.why.split("\n");
      for (const line of lines) {
        text(`   ${line}`);
      }
      blank();
    }

    // Fix available
    if (check.fixDescription !== null) {
      text(`${cyan("Fix available:")} ${check.fixDescription}`);
      blank();
    }

    // Tool link
    const toolLink = getToolLink(check.tags);
    if (toolLink) {
      muted(`Documentation: ${toolLink.url}`);
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
            async (c) => {
              try {
                const result = await opt.runFix();
                blank();
                if (result.success) {
                  success(result.message, 3);
                  c.stats.fixed++;
                  removeFixedCheck(c);
                } else {
                  error(result.message, 3);
                }
              } catch (error_) {
                error(getErrorMessage(error_), 3);
              }
              blank();
              return SCREEN.overview;
            },
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
          async (c) => {
            try {
              const result = await runFix();
              blank();
              if (result.success) {
                success(result.message, 3);
                c.stats.fixed++;
                removeFixedCheck(c);
              } else {
                error(result.message, 3);
              }
            } catch (error_) {
              error(getErrorMessage(error_), 3);
            }
            blank();
            return SCREEN.overview;
          },
          check.fixDescription ?? undefined,
        ),
      );
    }

    // Tool docs link
    const toolLink = getToolLink(check.tags);
    if (toolLink) {
      opts.push(
        action(
          "docs",
          "Copy docs URL",
          async () => {
            const ok = await copyToClipboard(toolLink.url);
            blank();
            if (ok) {
              success(`Copied ${toolLink.url} to clipboard`, 3);
            } else {
              muted(`URL: ${toolLink.url}`, 3);
            }
            blank();
            // eslint-disable-next-line unicorn/no-useless-undefined
            return undefined;
          },
          `Copy ${toolLink.tool} documentation URL to clipboard`,
        ),
      );
    }

    return opts;
  },
};
