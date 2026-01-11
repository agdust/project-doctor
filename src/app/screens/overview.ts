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
  parent: "issues",

  render: (ctx) => {
    title("Failed Checks Overview");
    blank();

    const checks = ctx.failedChecks;

    // Group by importance
    const required = checks.filter((c) => c.tags.includes("required"));
    const recommended = checks.filter((c) => c.tags.includes("recommended"));
    const opinionated = checks.filter((c) =>
      !c.tags.includes("required") && !c.tags.includes("recommended")
    );

    // Find max name length for alignment
    const maxNameLen = checks.length > 0 ? Math.max(...checks.map((c) => c.name.length)) : 0;

    if (required.length > 0) {
      muted(`Required (${required.length}):`);
      blank();
      for (const check of required) {
        const padding = " ".repeat(maxNameLen - check.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${check.name}${padding}\x1b[90m${check.message}\x1b[0m`);
      }
      blank();
    }

    if (recommended.length > 0) {
      muted(`Recommended (${recommended.length}):`);
      blank();
      for (const check of recommended) {
        const padding = " ".repeat(maxNameLen - check.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${check.name}${padding}\x1b[90m${check.message}\x1b[0m`);
      }
      blank();
    }

    if (opinionated.length > 0) {
      muted(`Opinionated (${opinionated.length}):`);
      blank();
      for (const check of opinionated) {
        const padding = " ".repeat(maxNameLen - check.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${check.name}${padding}\x1b[90m${check.message}\x1b[0m`);
      }
      blank();
    }
  },

  options: () => {
    // No options - just back navigation
    return [];
  },
};
