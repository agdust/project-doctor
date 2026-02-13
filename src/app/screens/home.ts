/**
 * Home Screen
 *
 * Shows project health summary and main navigation options.
 */

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
      text(`\x1b[90mProject type: ${typeLabel}\x1b[0m`);
    } else {
      const detectedFrom = config.projectTypeDetectedFrom;
      if (detectedFrom === "fallback") {
        text(`\x1b[90mProject type: ${typeLabel} (no JS files detected)\x1b[0m`);
      } else {
        text(`\x1b[90mProject type: ${typeLabel} (detected from ${detectedFrom})\x1b[0m`);
      }
      text(`\x1b[90mYou can set project type manually in Config → Project type\x1b[0m`);
    }
    blank();

    // Failed checks summary
    const failed = ctx.allResults.filter((r) => r.status === "fail").length;
    const total = ctx.allResults.length;

    if (failed > 0) {
      text(`\x1b[31mFailed checks ${failed}/${total}\x1b[0m`);
    } else {
      text(`\x1b[32mAll checks passing (${total})\x1b[0m`);
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
    const issueCount = ctx.issues.length;

    // Current issues (if any fixable)
    if (issueCount > 0) {
      opts.push(
        nav("issues", "Current issues", "issues", {
          badge: `${issueCount} auto-fixable`,
        })
      );
    }

    // Config
    opts.push(
      nav("config", "Config", "config", {
        description: "Manage categories and checks",
      })
    );

    // Run checks again
    opts.push(
      action("rescan", "Run checks again", async () => {
        return "scanning";
      })
    );

    // About
    opts.push(
      nav("about", "About Project Doctor", "about")
    );

    opts.push(separator());

    // Exit
    opts.push(
      action("exit", "Exit", async () => {
        return "__exit__";
      })
    );

    return opts;
  },
};
