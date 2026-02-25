/**
 * Manual Disabled Screen
 *
 * Shows permanently disabled manual checks, with option to re-enable.
 */

import { dim } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, text, success, error } from "../../cli-framework/index.js";
import { setCheckSeverity } from "../../config/loader.js";
import type { AppContext } from "../types.js";

export const manualDisabledScreen: Screen<AppContext> = {
  id: "manual-disabled",
  parent: "manual-checklist",

  render: (ctx) => {
    const count = ctx.manualCheckItems.filter((i) => i.displayState === "disabled").length;
    text(dim(`${count} disabled`));
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    for (const [index, item] of ctx.manualCheckItems.entries()) {
      if (item.displayState !== "disabled") {
        continue;
      }
      const label = `${dim("–")}  ${item.check.description}`;
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
        action("enable-all", "Enable all", async (c) => {
          let count = 0;
          for (const item of c.manualCheckItems) {
            if (item.displayState !== "disabled") {
              continue;
            }
            try {
              await setCheckSeverity(c.projectPath, item.check.name, "error");
              item.displayState = item.state === "done" ? "done" : "not-done";
              count++;
            } catch (error_) {
              error(error_ instanceof Error ? error_.message : "Unknown error", 3);
            }
          }
          blank();
          success(`Enabled ${count} item${count === 1 ? "" : "s"}`, 3);
          blank();
          return "manual-checklist";
        }),
      );
    }

    return opts;
  },
};
