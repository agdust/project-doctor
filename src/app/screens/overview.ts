/**
 * Overview Screen
 *
 * Shows all failed checks as a selectable menu.
 */

import { red } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, title, muted, ICONS } from "../../cli-framework/index.js";
import type { AppContext, FailedCheck } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { TAG } from "../../types.js";

function formatCheckOption(check: FailedCheck): { name: string; description: string } {
  return {
    name: `${red(ICONS.fail)} ${check.description}`,
    description: check.message,
  };
}

export const overviewScreen: Screen<AppContext> = {
  id: SCREEN.overview,
  parent: SCREEN.issues,

  render: (ctx) => {
    title("Failed Checks Overview");
    blank();

    if (ctx.failedChecks.length === 0) {
      muted("No failed checks");
      blank();
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const checks = ctx.failedChecks;
    if (checks.length === 0) {
      return [];
    }

    const opts: Option<AppContext>[] = [];

    // Group by importance
    const sections: { label: string; items: FailedCheck[] }[] = [
      { label: "Required", items: checks.filter((c) => c.tags.includes(TAG.required)) },
      { label: "Recommended", items: checks.filter((c) => c.tags.includes(TAG.recommended)) },
      {
        label: "Opinionated",
        items: checks.filter(
          (c) => !c.tags.includes(TAG.required) && !c.tags.includes(TAG.recommended),
        ),
      },
    ];

    for (const { label, items } of sections) {
      if (items.length === 0) {
        continue;
      }
      opts.push(separator(`${label} (${items.length})`));
      for (const check of items) {
        const { name, description } = formatCheckOption(check);
        const index = checks.indexOf(check);
        opts.push(
          action(
            `check-${index}`,
            name,
            (c) => {
              c.selectedOverviewIndex = index;
              return SCREEN.overviewDetail;
            },
            description,
          ),
        );
      }
    }

    return opts;
  },
};
