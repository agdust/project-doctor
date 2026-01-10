/**
 * Issue Detail Screen
 *
 * Shows single issue with fix options.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import JSON5 from "json5";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, title, muted, text, divider, success, error } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

async function addToExcludeChecks(projectPath: string, checkName: string): Promise<void> {
  const configDir = join(projectPath, ".project-doctor");
  const configPath = join(configDir, "config.json5");
  await mkdir(configDir, { recursive: true });

  let config: Record<string, unknown> = {};
  try {
    const content = await readFile(configPath, "utf-8");
    config = JSON5.parse(content);
  } catch {
    // No existing config
  }

  const excludeChecks = (config.excludeChecks as string[]) ?? [];
  if (!excludeChecks.includes(checkName)) {
    excludeChecks.push(checkName);
  }
  config.excludeChecks = excludeChecks;

  await writeFile(configPath, JSON5.stringify(config, null, 2) + "\n", "utf-8");
}

export const issueDetailScreen: Screen<AppContext> = {
  id: "issue-detail",

  render: (ctx) => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (!issue) {
      blank();
      title("No more issues");
      muted("All issues have been addressed.");
      blank();
      return;
    }

    const total = ctx.issues.length;
    const current = ctx.currentIssueIndex + 1;

    divider();
    blank();
    text(`\x1b[31m✗\x1b[0m  \x1b[1m${issue.name}\x1b[0m  \x1b[90m(${current}/${total})\x1b[0m`);
    text(`   ${issue.result.message}`);
    blank();
    text(`   \x1b[36mFix:\x1b[0m ${issue.fixDescription}`);
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const issue = ctx.issues[ctx.currentIssueIndex];

    // No issue - show done
    if (!issue) {
      return [
        action("done", "Done", async () => {
          return "home";
        }),
      ];
    }

    const opts: Option<AppContext>[] = [];

    // Apply fix
    opts.push(
      action("fix", "Apply fix", async (c) => {
        try {
          const result = await issue.runFix();
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

        // Move to next issue
        return moveToNextIssue(c);
      }, "Create or modify the file")
    );

    // Why? (if available)
    if (issue.why) {
      opts.push(
        action("why", "Why?", async (c) => {
          return "why";
        }, "Learn why this check matters")
      );
    }

    // Disable check
    opts.push(
      action("disable", "Disable check", async (c) => {
        try {
          await addToExcludeChecks(c.projectPath, issue.name);
          blank();
          muted("Disabled in config", 3);
          c.stats.disabled++;
        } catch (err) {
          error(err instanceof Error ? err.message : "Unknown error", 3);
        }
        blank();

        return moveToNextIssue(c);
      }, "Add to excludeChecks in config")
    );

    // Skip
    opts.push(
      action("skip", "Skip for now", async (c) => {
        blank();
        muted("Skipped", 3);
        c.stats.skipped++;
        blank();

        return moveToNextIssue(c);
      })
    );

    return opts;
  },
};

function moveToNextIssue(ctx: AppContext): string | undefined {
  ctx.currentIssueIndex++;

  if (ctx.currentIssueIndex >= ctx.issues.length) {
    // All done - show summary and go home
    return "summary";
  }

  // Stay on issue-detail for next issue (re-render)
  return undefined;
}
