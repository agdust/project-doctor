/**
 * Manual Muted Screen
 *
 * Shows temporarily muted manual checks, with option to unmute.
 */

import { yellow } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import {
  action,
  separator,
  blank,
  text,
  success,
  error,
  ICONS,
} from "../../cli-framework/index.js";
import { setCheckSeverity } from "../../config/loader.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const manualMutedScreen: Screen<AppContext> = {
  id: SCREEN.manualMuted,
  parent: SCREEN.manualChecklist,

  render: (ctx) => {
    const count = ctx.manualCheckItems.filter((i) => i.displayState === "muted").length;
    text(yellow(`${count} muted`));
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    for (const [index, item] of ctx.manualCheckItems.entries()) {
      if (item.displayState !== "muted") {
        continue;
      }
      const label = `${yellow(ICONS.muted)}  ${item.check.description}`;
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
        action("unmute-all", "Unmute all", async (c) => {
          let count = 0;
          for (const item of c.manualCheckItems) {
            if (item.displayState !== "muted") {
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
          success(`Unmuted ${count} item${count === 1 ? "" : "s"}`, 3);
          blank();
          return SCREEN.manualChecklist;
        }),
      );
    }

    return opts;
  },
};
