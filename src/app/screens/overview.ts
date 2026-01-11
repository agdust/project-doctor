/**
 * Overview Screen
 *
 * Shows all failed checks as a selectable menu.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator } from "../../cli-framework/index.js";
import { blank, title, muted } from "../../cli-framework/index.js";
import type { AppContext, FailedCheck } from "../types.js";

function formatCheckOption(check: FailedCheck, maxNameLen: number): { name: string; description: string } {
  const padding = " ".repeat(maxNameLen - check.name.length);
  return {
    name: `\x1b[31m✗\x1b[0m ${check.name}${padding}`,
    description: check.message,
  };
}

export const overviewScreen: Screen<AppContext> = {
  id: "overview",
  parent: "issues",

  render: (ctx) => {
    title("Failed Checks Overview");
    blank();

    if (ctx.failedChecks.length === 0) {
      muted("No failed checks");
      blank();
    }
  },

  options: (ctx): Option<AppContext>[] => {
    const checks = ctx.failedChecks;
    if (checks.length === 0) return [];

    const opts: Option<AppContext>[] = [];

    // Group by importance
    const required = checks.filter((c) => c.tags.includes("required"));
    const recommended = checks.filter((c) => c.tags.includes("recommended"));
    const opinionated = checks.filter((c) =>
      !c.tags.includes("required") && !c.tags.includes("recommended")
    );

    // Find max name length for alignment
    const maxNameLen = Math.max(...checks.map((c) => c.name.length));

    // Add required checks
    if (required.length > 0) {
      opts.push(separator(`Required (${required.length})`));
      for (const check of required) {
        const { name, description } = formatCheckOption(check, maxNameLen);
        const index = checks.indexOf(check);
        opts.push(
          action(`check-${index}`, name, async (c) => {
            c.selectedOverviewIndex = index;
            return "overview-detail";
          }, description)
        );
      }
    }

    // Add recommended checks
    if (recommended.length > 0) {
      opts.push(separator(`Recommended (${recommended.length})`));
      for (const check of recommended) {
        const { name, description } = formatCheckOption(check, maxNameLen);
        const index = checks.indexOf(check);
        opts.push(
          action(`check-${index}`, name, async (c) => {
            c.selectedOverviewIndex = index;
            return "overview-detail";
          }, description)
        );
      }
    }

    // Add opinionated checks
    if (opinionated.length > 0) {
      opts.push(separator(`Opinionated (${opinionated.length})`));
      for (const check of opinionated) {
        const { name, description } = formatCheckOption(check, maxNameLen);
        const index = checks.indexOf(check);
        opts.push(
          action(`check-${index}`, name, async (c) => {
            c.selectedOverviewIndex = index;
            return "overview-detail";
          }, description)
        );
      }
    }

    return opts;
  },
};
