/**
 * Manual Check Detail Screen
 *
 * Shows a single manual check with its details and toggle action.
 */

import { bold, dim, green, yellow, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, blank, text, success, error, ICONS } from "../../cli-framework/index.js";
import { setManualCheckState, setCheckSeverity } from "../../config/loader.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { AppContext, ManualCheckItem } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { createMuteDisableActions } from "./shared.js";

/** Icon and label for each display state */
function statusDisplay(item: ManualCheckItem): { icon: string; label: string } {
  switch (item.displayState) {
    case "done": {
      return { icon: green(ICONS.pass), label: green("Verified") };
    }
    case "not-done": {
      return { icon: dim(ICONS.unchecked), label: dim("Not verified") };
    }
    case "muted": {
      return { icon: yellow(ICONS.muted), label: yellow("Muted") };
    }
    case "disabled": {
      return { icon: dim(ICONS.disabled), label: dim("Disabled") };
    }
  }
}

export const manualCheckDetailScreen: Screen<AppContext> = {
  id: SCREEN.manualCheckDetail,
  parent: SCREEN.manualChecklist,

  render: (ctx) => {
    const item = ctx.manualCheckItems[ctx.selectedManualCheckIndex];
    if (item === undefined) {
      return;
    }

    const { icon, label } = statusDisplay(item);

    text(`${icon}  ${bold(item.check.name)}  ${label}`);
    blank();
    text(`   ${item.check.description}`);
    blank();

    // Show details
    text(cyan("Details:"));
    for (const line of item.check.details.split("\n")) {
      text(`   ${line}`);
    }
    blank();

    // Show why (if available)
    if (item.check.why !== undefined) {
      text(cyan("Why:"));
      text(`   ${item.check.why}`);
      blank();
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const item = ctx.manualCheckItems[ctx.selectedManualCheckIndex];
    if (item === undefined) {
      return [];
    }

    const opts: Option<AppContext>[] = [];

    // Mark done / not done toggle (only for active checks)
    if (item.displayState === "not-done") {
      opts.push(
        action("mark-done", "Mark as done", async (c) => {
          try {
            await setManualCheckState(c.projectPath, item.check.name, "done");
            item.state = "done";
            item.displayState = "done";
            blank();
            success("Marked as done", 3);
          } catch (error_) {
            error(getErrorMessage(error_), 3);
          }
          blank();
          return SCREEN.manualChecklist;
        }),
      );
    } else if (item.displayState === "done") {
      opts.push(
        action("mark-not-done", "Mark as not done", async (c) => {
          try {
            await setManualCheckState(c.projectPath, item.check.name, "not-done");
            item.state = "not-done";
            item.displayState = "not-done";
            blank();
            success("Marked as not done", 3);
          } catch (error_) {
            error(getErrorMessage(error_), 3);
          }
          blank();
          return SCREEN.manualChecklist;
        }),
      );
    }

    // Re-enable (for muted/disabled checks)
    if (item.displayState === "muted" || item.displayState === "disabled") {
      opts.push(
        action("re-enable", "Re-enable", async (c) => {
          try {
            await setCheckSeverity(c.projectPath, item.check.name, "error");
            item.displayState = item.state === "done" ? "done" : "not-done";
            blank();
            success("Re-enabled", 3);
          } catch (error_) {
            error(getErrorMessage(error_), 3);
          }
          blank();
          return SCREEN.manualChecklist;
        }),
      );
    }

    // Mute/disable only for active checks (not already muted/disabled)
    if (item.displayState === "done" || item.displayState === "not-done") {
      opts.push(
        ...createMuteDisableActions({
          getCheckName: () => item.check.name,
          onComplete: () => SCREEN.manualChecklist,
          extraOnMute: (c) => {
            const currentItem = c.manualCheckItems[c.selectedManualCheckIndex];
            if (currentItem !== undefined) {
              currentItem.displayState = "muted";
            }
          },
          extraOnDisable: (c) => {
            const currentItem = c.manualCheckItems[c.selectedManualCheckIndex];
            if (currentItem !== undefined) {
              currentItem.displayState = "disabled";
            }
          },
        }),
      );
    }

    return opts;
  },
};
