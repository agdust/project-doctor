/**
 * Manual Muted Screen
 *
 * Shows temporarily muted manual checks, with option to unmute.
 */

import { yellow } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, text, success, error  } from "../../cli-framework/index.js";
import { setCheckSeverity } from "../../config/loader.js";
import type { AppContext } from "../types.js";

export const manualMutedScreen: Screen<AppContext> = {
  id: "manual-muted",
  parent: "manual-checklist",

  render: (ctx) => {
    const count = ctx.manualCheckItems.filter((i) => i.displayState === "muted").length;
    text(yellow(`${count} muted`));
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    for (const [index, item] of ctx.manualCheckItems.entries()) {
      if (item.displayState !== "muted") continue;
      const label = `${yellow("⏲")}  ${item.check.description}`;
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
        action("unmute-all", "Unmute all", async (c) => {
          let count = 0;
          for (const item of c.manualCheckItems) {
            if (item.displayState !== "muted") continue;
            try {
              await setCheckSeverity(c.projectPath, item.check.name, "error");
              item.displayState = item.state === "done" ? "done" : "not-done";
              count++;
            } catch (error_) {
              error(error_ instanceof Error ? error_.message : "Unknown error", 3);
            }
          }
          blank();
          success(`Unmuted ${count} item${count === 1 ? "" : "s"}`, 3);
          blank();
          return "manual-checklist";
        }),
      );
    }

    return opts;
  },
};
