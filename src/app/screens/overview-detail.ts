/**
 * Overview Detail Screen
 *
 * Shows detailed information about a selected failed check.
 */

import { exec } from "node:child_process";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator } from "../../cli-framework/index.js";
import { blank, text, muted, success, error } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

function openBrowser(url: string): Promise<void> {
  return new Promise((resolve) => {
    const cmd = process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;

    exec(cmd, () => resolve());
  });
}

// Tool documentation links
const TOOL_DOCS: Record<string, string> = {
  eslint: "https://eslint.org/docs/latest/",
  prettier: "https://prettier.io/docs/en/",
  typescript: "https://www.typescriptlang.org/docs/",
  vitest: "https://vitest.dev/guide/",
  knip: "https://knip.dev/",
  jscpd: "https://github.com/kucherenko/jscpd",
};

function getToolLink(tags: string[]): { tool: string; url: string } | null {
  for (const tag of tags) {
    if (tag.startsWith("tool:")) {
      const tool = tag.slice(5);
      const url = TOOL_DOCS[tool];
      if (url) {
        return { tool, url };
      }
    }
  }
  return null;
}

export const overviewDetailScreen: Screen<AppContext> = {
  id: "overview-detail",
  parent: "overview",

  render: (ctx) => {
    const check = ctx.failedChecks[ctx.selectedOverviewIndex];
    if (!check) {
      muted("Check not found");
      blank();
      return;
    }

    // Check name and message
    text(`\x1b[31m✗\x1b[0m  \x1b[1m${check.name}\x1b[0m`);
    text(`   ${check.message}`);
    blank();

    // Why section
    if (check.why) {
      text("\x1b[1mWhy this matters\x1b[0m");
      blank();
      // Indent and wrap the why text
      const lines = check.why.split("\n");
      for (const line of lines) {
        text(`   ${line}`);
      }
      blank();
    }

    // Fix available
    if (check.fixDescription) {
      text(`\x1b[36mFix available:\x1b[0m ${check.fixDescription}`);
      blank();
    }

    // Tool link
    const toolLink = getToolLink(check.tags);
    if (toolLink) {
      muted(`Documentation: ${toolLink.url}`);
      blank();
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const check = ctx.failedChecks[ctx.selectedOverviewIndex];
    if (!check) return [];

    const opts: Option<AppContext>[] = [];

    // Fix options if available
    if (check.fixOptions && check.fixOptions.length > 0) {
      opts.push(separator("Fix options"));
      for (const opt of check.fixOptions) {
        opts.push(
          action(opt.id, opt.label, async (c) => {
            try {
              const result = await opt.runFix();
              blank();
              if (result.success) {
                success(result.message, 3);
                c.stats.fixed++;
              } else {
                error(result.message, 3);
              }
            } catch (err) {
              error(err instanceof Error ? err.message : "Unknown error", 3);
            }
            blank();
            return "overview";
          }, opt.description)
        );
      }
    } else if (check.runFix) {
      opts.push(
        action("fix", "Apply fix", async (c) => {
          try {
            const result = await check.runFix!();
            blank();
            if (result.success) {
              success(result.message, 3);
              c.stats.fixed++;
            } else {
              error(result.message, 3);
            }
          } catch (err) {
            error(err instanceof Error ? err.message : "Unknown error", 3);
          }
          blank();
          return "overview";
        }, check.fixDescription ?? undefined)
      );
    }

    // Tool docs link
    const toolLink = getToolLink(check.tags);
    if (toolLink) {
      opts.push(
        action("docs", "Open tool docs", async () => {
          await openBrowser(toolLink.url);
          blank();
          muted(`Opened ${toolLink.url}`, 3);
          blank();
          return undefined;
        }, `Open ${toolLink.tool} documentation in browser`)
      );
    }

    return opts;
  },
};
