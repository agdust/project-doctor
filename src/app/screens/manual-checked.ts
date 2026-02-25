/**
 * Manual Done Screen
 *
 * Shows manual checks marked as done, with option to uncheck.
 */

import { green } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, text, success, error } from "../../cli-framework/index.js";
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

    for (const [index, item] of ctx.manualCheckItems.entries()) {
      if (item.displayState !== "done") {
        continue;
      }
      const label = `${green("✓")}  ${item.check.description}`;
      opts.push(
        action(`manual-${index}`, label, (c) => {
          c.selectedManualCheckIndex = index;
          return "manual-check-detail";
        }),
      );
    }

    if (opts.length > 0) {
      opts.push(
        separator(),
        action("uncheck-all", "Uncheck all", async (c) => {
          let count = 0;
          for (const item of c.manualCheckItems) {
            if (item.displayState !== "done") {
              continue;
            }
            try {
              await setManualCheckState(c.projectPath, item.check.name, "not-done");
              item.state = "not-done";
              item.displayState = "not-done";
              count++;
            } catch (error_) {
              error(error_ instanceof Error ? error_.message : "Unknown error", 3);
            }
          }
          blank();
          success(`Unchecked ${count} item${count === 1 ? "" : "s"}`, 3);
          blank();
          return "manual-checklist";
        }),
      );
    }

    return opts;
  },
};
