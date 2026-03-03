/**
 * Manual Check Detail Screen
 *
 * Shows a single manual check with its details and toggle action.
 */

import { bold, dim, green, yellow, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, blank, text, success, error, muted } from "../../cli-framework/index.js";
import { setManualCheckState, setCheckSeverity } from "../../config/loader.js";
import { createSkipUntil } from "../../config/types.js";
import type { AppContext, ManualCheckItem } from "../types.js";

/** Icon and label for each display state */
function statusDisplay(item: ManualCheckItem): { icon: string; label: string } {
  switch (item.displayState) {
    case "done": {
      return { icon: green("✓"), label: green("Verified") };
    }
    case "not-done": {
      return { icon: dim("□"), label: dim("Not verified") };
    }
    case "muted": {
      // AGENT: unify usage if these icons too. Do not use them directly, only via enumish object
      return { icon: yellow("⏲"), label: yellow("Muted") };
    }
    case "disabled": {
      return { icon: dim("–"), label: dim("Disabled") };
    }
  }
}

export const manualCheckDetailScreen: Screen<AppContext> = {
  id: "manual-check-detail",
  parent: "manual-checklist",

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
            error(error_ instanceof Error ? error_.message : "Unknown error", 3);
          }
          blank();
          return "manual-checklist";
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
            error(error_ instanceof Error ? error_.message : "Unknown error", 3);
          }
          blank();
          return "manual-checklist";
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
            error(error_ instanceof Error ? error_.message : "Unknown error", 3);
          }
          blank();
          return "manual-checklist";
        }),
      );
    }

    // Mute/disable only for active checks (not already muted/disabled)
    if (item.displayState === "done" || item.displayState === "not-done") {
      // Mute for 2 weeks, Mute for 2 months, Disable permanently
      opts.push(
        action("mute-2w", "Mute for 2 weeks", async (c) => {
          try {
            const muteDate = new Date();
            muteDate.setDate(muteDate.getDate() + 14);
            await setCheckSeverity(c.projectPath, item.check.name, createSkipUntil(muteDate));
            item.displayState = "muted";
            c.stats.muted++;
            blank();
            muted("Muted for 2 weeks", 3);
          } catch (error_) {
            error(error_ instanceof Error ? error_.message : "Unknown error", 3);
          }
          blank();
          return "manual-checklist";
        }),
        action("mute-2m", "Mute for 2 months", async (c) => {
          try {
            const muteDate = new Date();
            muteDate.setMonth(muteDate.getMonth() + 2);
            await setCheckSeverity(c.projectPath, item.check.name, createSkipUntil(muteDate));
            item.displayState = "muted";
            c.stats.muted++;
            blank();
            muted("Muted for 2 months", 3);
          } catch (error_) {
            error(error_ instanceof Error ? error_.message : "Unknown error", 3);
          }
          blank();
          return "manual-checklist";
        }),
        action("disable", "Disable", async (c) => {
          try {
            await setCheckSeverity(c.projectPath, item.check.name, "off");
            item.displayState = "disabled";
            c.stats.disabled++;
            blank();
            muted("Disabled permanently", 3);
          } catch (error_) {
            error(error_ instanceof Error ? error_.message : "Unknown error", 3);
          }
          blank();
          return "manual-checklist";
        }),
      );
    }

    return opts;
  },
};
