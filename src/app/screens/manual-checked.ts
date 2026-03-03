/**
 * Manual Done Screen
 *
 * Shows manual checks marked as done, with option to uncheck.
 */

import { green } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, text, success, error, ICONS } from "../../cli-framework/index.js";
import { setManualCheckState } from "../../config/loader.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const manualDoneScreen: Screen<AppContext> = {
  id: SCREEN.manualDone,
  parent: SCREEN.manualChecklist,

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
      const label = `${green(ICONS.pass)}  ${item.check.description}`;
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
              error(getErrorMessage(error_), 3);
            }
          }
          blank();
          success(`Unchecked ${count} item${count === 1 ? "" : "s"}`, 3);
          blank();
          return SCREEN.manualChecklist;
        }),
      );
    }

    return opts;
  },
};
