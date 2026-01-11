/**
 * Overview Screen
 *
 * Shows detailed information about all failed checks.
 */

import type { Screen } from "../../cli-framework/index.js";
import { blank, title, muted, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const overviewScreen: Screen<AppContext> = {
  id: "overview",

  render: (ctx) => {
    title("Failed Checks Overview");
    blank();

    // Group by importance
    const required = ctx.issues.filter((i) => i.tags.includes("required"));
    const recommended = ctx.issues.filter((i) => i.tags.includes("recommended"));
    const opinionated = ctx.issues.filter((i) =>
      !i.tags.includes("required") && !i.tags.includes("recommended")
    );

    // Find max name length for alignment
    const maxNameLen = Math.max(...ctx.issues.map((i) => i.name.length));

    if (required.length > 0) {
      muted(`Required (${required.length}):`);
      blank();
      for (const issue of required) {
        const padding = " ".repeat(maxNameLen - issue.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${issue.name}${padding}\x1b[90m${issue.result.message}\x1b[0m`);
        if (issue.fixDescription) {
          muted(`    Fix: ${issue.fixDescription}`, 0);
        }
        blank();
      }
    }

    if (recommended.length > 0) {
      muted(`Recommended (${recommended.length}):`);
      blank();
      for (const issue of recommended) {
        const padding = " ".repeat(maxNameLen - issue.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${issue.name}${padding}\x1b[90m${issue.result.message}\x1b[0m`);
        if (issue.fixDescription) {
          muted(`    Fix: ${issue.fixDescription}`, 0);
        }
        blank();
      }
    }

    if (opinionated.length > 0) {
      muted(`Opinionated (${opinionated.length}):`);
      blank();
      for (const issue of opinionated) {
        const padding = " ".repeat(maxNameLen - issue.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${issue.name}${padding}\x1b[90m${issue.result.message}\x1b[0m`);
        if (issue.fixDescription) {
          muted(`    Fix: ${issue.fixDescription}`, 0);
        }
        blank();
      }
    }
  },

  options: () => {
    // No options - just back navigation
    return [];
  },
};
