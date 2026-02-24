/**
 * Manual Check Detail Screen
 *
 * Shows a single manual check with its details and toggle action.
 */

import { bold, dim, green, cyan } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, text, success, error, muted } from "../../cli-framework/index.js";
import { setManualCheckState, setCheckSeverity } from "../../config/loader.js";
import { createSkipUntil } from "../../config/types.js";
import type { AppContext } from "../types.js";

export const manualCheckDetailScreen: Screen<AppContext> = {
  id: "manual-check-detail",
  parent: "manual-checklist",

  render: (ctx) => {
    const item = ctx.manualCheckItems[ctx.selectedManualCheckIndex];
    if (!item) return;

    const statusIcon = item.state === "done" ? green("✓") : dim("○");
    const statusLabel = item.state === "done" ? green("Verified") : dim("Not verified");

    text(`${statusIcon}  ${bold(item.check.name)}  ${statusLabel}`);
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
    if (item.check.why) {
      text(cyan("Why:"));
      text(`   ${item.check.why}`);
      blank();
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const item = ctx.manualCheckItems[ctx.selectedManualCheckIndex];
    if (!item) return [];

    const opts: Option<AppContext>[] = [];

    // Mark done / not done toggle
    if (item.state === "not-done") {
      opts.push(
        action("mark-done", "Mark as done", async (c) => {
          try {
            await setManualCheckState(c.projectPath, item.check.name, "done");
            item.state = "done";
            blank();
            success("Marked as done", 3);
          } catch (err) {
            error(err instanceof Error ? err.message : "Unknown error", 3);
          }
          blank();
          return undefined;
        }),
      );
    } else {
      opts.push(
        action("mark-not-done", "Mark as not done", async (c) => {
          try {
            await setManualCheckState(c.projectPath, item.check.name, "not-done");
            item.state = "not-done";
            blank();
            success("Marked as not done", 3);
          } catch (err) {
            error(err instanceof Error ? err.message : "Unknown error", 3);
          }
          blank();
          return undefined;
        }),
      );
    }

    // Mute for 2 weeks
    opts.push(
      action("mute-2w", "Mute for 2 weeks", async (c) => {
        try {
          const muteDate = new Date();
          muteDate.setDate(muteDate.getDate() + 14);
          await setCheckSeverity(c.projectPath, item.check.name, createSkipUntil(muteDate));
          c.manualCheckItems.splice(ctx.selectedManualCheckIndex, 1);
          c.stats.muted++;
          blank();
          muted("Muted for 2 weeks", 3);
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();
        return "manual-checklist";
      }),
    );

    // Mute for 2 months
    opts.push(
      action("mute-2m", "Mute for 2 months", async (c) => {
        try {
          const muteDate = new Date();
          muteDate.setMonth(muteDate.getMonth() + 2);
          await setCheckSeverity(c.projectPath, item.check.name, createSkipUntil(muteDate));
          c.manualCheckItems.splice(ctx.selectedManualCheckIndex, 1);
          c.stats.muted++;
          blank();
          muted("Muted for 2 months", 3);
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();
        return "manual-checklist";
      }),
    );

    // Disable permanently
    opts.push(
      action("disable", "Disable", async (c) => {
        try {
          await setCheckSeverity(c.projectPath, item.check.name, "off");
          c.manualCheckItems.splice(ctx.selectedManualCheckIndex, 1);
          c.stats.disabled++;
          blank();
          muted("Disabled permanently", 3);
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();
        return "manual-checklist";
      }),
    );

    return opts;
  },
};
