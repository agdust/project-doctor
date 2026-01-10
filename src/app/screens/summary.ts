/**
 * Summary Screen
 *
 * Shows session summary after completing all issues.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, title, text, divider } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const summaryScreen: Screen<AppContext> = {
  id: "summary",

  render: (ctx) => {
    divider();
    blank();
    title("Summary");
    blank();

    const { fixed, disabled, skipped } = ctx.stats;

    if (fixed > 0) {
      text(`\x1b[32m✓\x1b[0m ${fixed} fixed`);
    }
    if (disabled > 0) {
      text(`\x1b[33m⊘\x1b[0m ${disabled} disabled`);
    }
    if (skipped > 0) {
      text(`\x1b[90m→\x1b[0m ${skipped} skipped`);
    }

    if (fixed === 0 && disabled === 0 && skipped === 0) {
      text("No changes made.");
    }

    blank();
  },

  options: (): Option<AppContext>[] => [
    action("home", "Back to home", async () => "home"),
    action("exit", "Exit", async () => "__exit__"),
  ],
};
