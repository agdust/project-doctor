/**
 * Manual Disabled Screen
 *
 * Shows permanently disabled manual checks, with option to re-enable.
 */

import { dim } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator } from "../../cli-framework/index.js";
import { blank, text, success, error } from "../../cli-framework/index.js";
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

    ctx.manualCheckItems.forEach((item, index) => {
      if (item.displayState !== "disabled") return;
      const label = `${dim("–")}  ${item.check.description}`;
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
        action("enable-all", "Enable all", async (c) => {
          let count = 0;
          for (const item of c.manualCheckItems) {
            if (item.displayState !== "disabled") continue;
            try {
              await setCheckSeverity(c.projectPath, item.check.name, "error");
              item.displayState = item.state === "done" ? "done" : "not-done";
              count++;
            } catch (err) {
              error(err instanceof Error ? err.message : "Unknown error", 3);
            }
          }
          blank();
          success(`Enabled ${count} item${count !== 1 ? "s" : ""}`, 3);
          blank();
          return "manual-checklist";
        }),
      );
    }

    return opts;
  },
};
