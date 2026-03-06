/**
 * Summary Screen
 *
 * Shows session summary after completing all issues.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { blank, title, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { red } from "../../utils/colors.js";

export const summaryScreen: Screen<AppContext> = {
  id: SCREEN.summary,
  parent: SCREEN.home,

  render: (ctx) => {
    title("No more issues with auto-fixes");
    blank();

    const { fixed, muted, disabled, skipped } = ctx.stats;

    // Build summary parts
    const parts: string[] = [];
    if (fixed > 0) {
      parts.push(`${fixed} issue${fixed > 1 ? "s" : ""} fixed`);
    }
    if (muted > 0) {
      parts.push(`${muted} muted`);
    }
    if (disabled > 0) {
      parts.push(`${disabled} disabled`);
    }
    if (skipped > 0) {
      parts.push(red(`${skipped} remained unresolved`));
    }

    if (parts.length > 0) {
      text(parts.join(", "));
    } else {
      text("No changes made.");
    }

    blank();
  },

  options: (): Option<AppContext>[] => [],
};
