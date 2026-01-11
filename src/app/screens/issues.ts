/**
 * Issues List Screen
 *
 * Shows all fixable issues grouped by importance.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator } from "../../cli-framework/index.js";
import { blank, title, muted, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

function getEffortLabel(tags: string[]): string {
  if (tags.includes("effort:low")) return "easy";
  if (tags.includes("effort:medium")) return "medium";
  if (tags.includes("effort:high")) return "complex";
  return "";
}

function getImportanceLabel(tags: string[]): string {
  if (tags.includes("required")) return "required";
  if (tags.includes("recommended")) return "recommended";
  return "opinionated";
}

export const issuesScreen: Screen<AppContext> = {
  id: "issues",

  render: (ctx) => {
    title(`Issues (${ctx.issues.length})`);
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
      muted("Required:");
      for (const issue of required) {
        const padding = " ".repeat(maxNameLen - issue.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${issue.name}${padding}\x1b[90m${issue.result.message}\x1b[0m`);
        blank();
      }
    }

    if (recommended.length > 0) {
      muted("Recommended:");
      for (const issue of recommended) {
        const padding = " ".repeat(maxNameLen - issue.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${issue.name}${padding}\x1b[90m${issue.result.message}\x1b[0m`);
        blank();
      }
    }

    if (opinionated.length > 0) {
      muted("Opinionated:");
      for (const issue of opinionated) {
        const padding = " ".repeat(maxNameLen - issue.name.length + 2);
        text(`  \x1b[31m✗\x1b[0m ${issue.name}${padding}\x1b[90m${issue.result.message}\x1b[0m`);
        blank();
      }
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    // Individual fix options for each issue
    for (let i = 0; i < ctx.issues.length; i++) {
      const issue = ctx.issues[i];
      const effort = getEffortLabel(issue.tags);
      const effortBadge = effort ? ` (${effort})` : "";

      opts.push(
        action(
          `fix-${i}`,
          `Fix: ${issue.name}${effortBadge}`,
          async (c) => {
            c.currentIssueIndex = i;
            return "issue-detail";
          },
          issue.fixDescription
        )
      );
    }

    if (ctx.issues.length > 1) {
      opts.push(separator());
      opts.push(
        action("fix-all", `Fix all (${ctx.issues.length} issues)`, async (c) => {
          c.currentIssueIndex = 0;
          return "issue-detail";
        })
      );
    }

    return opts;
  },
};
