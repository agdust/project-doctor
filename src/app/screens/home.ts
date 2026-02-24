/**
 * Home Screen
 *
 * Shows project health summary and main navigation options.
 */

import { dim, red, green } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, action, separator } from "../../cli-framework/index.js";
import { blank, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const homeScreen: Screen<AppContext> = {
  id: "home",
  // Root screen - no parent

  render: (ctx) => {
    // Project type info
    const config = ctx.global.config;
    const typeLabel = config.projectType === "js" ? "JavaScript/Node" : "Generic";

    if (config.projectTypeSource === "config") {
      text(dim(`Project type: ${typeLabel}`));
    } else {
      const detectedFrom = config.projectTypeDetectedFrom;
      if (detectedFrom === "fallback") {
        text(dim(`Project type: ${typeLabel} (no JS files detected)`));
      } else {
        text(dim(`Project type: ${typeLabel} (detected from ${detectedFrom})`));
      }
      text(dim("You can set project type manually in Config → Project type"));
    }
    blank();

    // Failed checks summary
    const failed = ctx.allResults.filter((r) => r.status === "fail").length;
    const total = ctx.allResults.length;

    if (failed > 0) {
      text(red(`Failed checks ${failed}/${total}`));
    } else {
      text(green(`All checks passing (${total})`));
    }
    blank();

    // Category breakdown (only show non-empty)
    if (failed > 0) {
      const { required, recommended, opinionated } = ctx.failedByCategory;

      if (required > 0) {
        text(`  Required - ${required}`);
      }
      if (recommended > 0) {
        text(`  Recommended - ${recommended}`);
      }
      if (opinionated > 0) {
        text(`  Opinionated - ${opinionated}`);
      }
      blank();
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];
    const failedCount = ctx.failedChecks.length;
    const fixableCount = ctx.issues.length;

    // Current issues
    if (failedCount > 0) {
      const badge =
        fixableCount > 0 ? `${fixableCount} auto-fixable` : `${failedCount} failed`;
      opts.push(nav("issues", "Current issues", "issues", { badge }));
    } else {
      opts.push(nav("issues", "Current issues", "issues", { badge: "all passing" }));
    }

    // Manual checklist
    const doneCount = ctx.manualCheckItems.filter((i) => i.state === "done").length;
    const manualTotal = ctx.manualCheckItems.length;
    const manualBadge =
      manualTotal === 0
        ? "all done"
        : doneCount === manualTotal
          ? "all done"
          : `${manualTotal - doneCount} unchecked`;
    opts.push(nav("manual-checklist", "Manual checklist", "manual-checklist", { badge: manualBadge }));

    // Config
    opts.push(
      nav("config", "Config", "config", {
        description: "Manage categories and checks",
      }),
    );

    // Run checks again
    opts.push(
      action("rescan", "Run checks again", async () => {
        return "scanning";
      }),
    );

    // About
    opts.push(nav("about", "About Project Doctor", "about"));

    opts.push(separator());

    // Exit
    opts.push(
      action("exit", "Exit", async () => {
        return "__exit__";
      }),
    );

    return opts;
  },
};
