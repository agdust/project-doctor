/**
 * Manual Checklist Screen
 *
 * Shows all manual checks with done/not-done status.
 */

import { dim, green } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const manualChecklistScreen: Screen<AppContext> = {
  id: "manual-checklist",
  parent: "home",

  render: (ctx) => {
    const items = ctx.manualCheckItems;
    const doneCount = items.filter((i) => i.state === "done").length;
    const total = items.length;

    if (doneCount === total) {
      text(green(`All verified (${total}/${total})`));
    } else {
      text(`Verified ${doneCount}/${total}`);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    return ctx.manualCheckItems.map((item, index) => {
      const icon = item.state === "done" ? green("✓") : dim("○");
      const label = `${icon}  ${item.check.description}`;

      return action(`manual-${index}`, label, async (c) => {
        c.selectedManualCheckIndex = index;
        return "manual-check-detail";
      });
    });
  },
};
