/**
 * Manual Disabled Screen
 *
 * Shows permanently disabled manual checks, with option to re-enable.
 */

import { dim } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, text, success, error, ICONS } from "../../cli-framework/index.js";
import { setCheckSeverity } from "../../config/loader.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const manualDisabledScreen: Screen<AppContext> = {
  id: SCREEN.manualDisabled,
  parent: SCREEN.manualChecklist,

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
      const label = `${dim(ICONS.disabled)}  ${item.check.description}`;
      opts.push(
        action(`manual-${index}`, label, (c) => {
          c.selectedManualCheckIndex = index;
          return SCREEN.manualCheckDetail;
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
              error(getErrorMessage(error_), 3);
            }
          }
          blank();
          success(`Enabled ${count} item${count === 1 ? "" : "s"}`, 3);
          blank();
          return SCREEN.manualChecklist;
        }),
      );
    }

    return opts;
  },
};
