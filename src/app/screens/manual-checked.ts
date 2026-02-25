/**
 * Manual Done Screen
 *
 * Shows manual checks marked as done, with option to uncheck.
 */

import { green } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator } from "../../cli-framework/index.js";
import { blank, text, success, error } from "../../cli-framework/index.js";
import { setManualCheckState } from "../../config/loader.js";
import type { AppContext } from "../types.js";

export const manualDoneScreen: Screen<AppContext> = {
  id: "manual-done",
  parent: "manual-checklist",

  render: (ctx) => {
    const count = ctx.manualCheckItems.filter((i) => i.displayState === "done").length;
    text(green(`${count} checked`));
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    ctx.manualCheckItems.forEach((item, index) => {
      if (item.displayState !== "done") return;
      const label = `${green("✓")}  ${item.check.description}`;
      opts.push(
        action(`manual-${index}`, label, async (c) => {
          c.selectedManualCheckIndex = index;
          return "manual-check-detail";
        }),
      );
    });

    if (opts.length > 0) {
      opts.push(separator());
      opts.push(
        action("uncheck-all", "Uncheck all", async (c) => {
          let count = 0;
          for (const item of c.manualCheckItems) {
            if (item.displayState !== "done") continue;
            try {
              await setManualCheckState(c.projectPath, item.check.name, "not-done");
              item.state = "not-done";
              item.displayState = "not-done";
              count++;
            } catch (err) {
              error(err instanceof Error ? err.message : "Unknown error", 3);
            }
          }
          blank();
          success(`Unchecked ${count} item${count !== 1 ? "s" : ""}`, 3);
          blank();
          return "manual-checklist";
        }),
      );
    }

    return opts;
  },
};
