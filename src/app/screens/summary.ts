/**
 * Summary Screen
 *
 * Shows session summary after completing all issues.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, title, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const summaryScreen: Screen<AppContext> = {
  id: "summary",

  render: (ctx) => {
    title("Session Summary");
    blank();

    const { fixed, muted, disabled, skipped } = ctx.stats;

    // Build summary parts
    const parts: string[] = [];
    if (fixed > 0) {
      parts.push(`${fixed} issue${fixed > 1 ? "s" : ""} fixed`);
    }
    if (muted > 0) {
      parts.push(`${muted} temporarily muted`);
    }
    if (disabled > 0) {
      parts.push(`${disabled} disabled`);
    }
    if (skipped > 0) {
      parts.push(`${skipped} remained`);
    }

    if (parts.length > 0) {
      text(parts.join(", "));
    } else {
      text("No changes made.");
    }

    blank();
  },

  options: (): Option<AppContext>[] => [
    action("home", "Back to home", async () => "home"),
    action("exit", "Exit", async () => "__exit__"),
  ],
};
