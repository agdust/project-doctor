/**
 * Manual Checklist Screen
 *
 * Shows unchecked manual checks. Resolved entries viewable via sub-screens.
 */

import { dim, green, yellow } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, nav, separator } from "../../cli-framework/index.js";
import { blank, text } from "../../cli-framework/index.js";
import type { AppContext, ManualCheckItem } from "../types.js";

/** Icon for each display state */
function checkIcon(item: ManualCheckItem): string {
  switch (item.displayState) {
    case "done":
      return green("✓");
    case "not-done":
      return dim("□");
    case "muted":
      return yellow("⏲");
    case "disabled":
      return dim("–");
  }
}

export const manualChecklistScreen: Screen<AppContext> = {
  id: "manual-checklist",
  parent: "home",

  render: (ctx) => {
    const items = ctx.manualCheckItems;
    const doneCount = items.filter((i) => i.displayState === "done").length;
    const activeCount = items.filter(
      (i) => i.displayState === "done" || i.displayState === "not-done",
    ).length;

    if (activeCount === 0) {
      text(dim("No active checks"));
    } else if (doneCount === activeCount) {
      text(green(`All verified (${doneCount}/${activeCount})`));
    } else {
      text(`Verified ${doneCount}/${activeCount}`);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    // Show unchecked items
    ctx.manualCheckItems.forEach((item, index) => {
      if (item.displayState !== "not-done") return;
      const label = `${checkIcon(item)}  ${item.check.description}`;
      opts.push(
        action(`manual-${index}`, label, async (c) => {
          c.selectedManualCheckIndex = index;
          return "manual-check-detail";
        }),
      );
    });

    // Sub-lists for resolved states
    const doneCount = ctx.manualCheckItems.filter((i) => i.displayState === "done").length;
    const mutedCount = ctx.manualCheckItems.filter((i) => i.displayState === "muted").length;
    const disabledCount = ctx.manualCheckItems.filter(
      (i) => i.displayState === "disabled",
    ).length;

    if (doneCount > 0 || mutedCount > 0 || disabledCount > 0) {
      opts.push(separator());
    }

    if (doneCount > 0) {
      opts.push(
        nav("view-done", "View checked", "manual-done", {
          badge: `${doneCount}`,
        }),
      );
    }

    if (mutedCount > 0) {
      opts.push(
        nav("view-muted", "View muted", "manual-muted", {
          badge: `${mutedCount}`,
        }),
      );
    }

    if (disabledCount > 0) {
      opts.push(
        nav("view-disabled", "View disabled", "manual-disabled", {
          badge: `${disabledCount}`,
        }),
      );
    }

    return opts;
  },
};
