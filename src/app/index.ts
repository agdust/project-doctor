/**
 * Project Doctor App
 *
 * Multi-screen CLI app for project health checking and fixing.
 */

import { runApp, type AppConfig } from "../cli-framework/index.js";
import { blank, title, text, muted, divider } from "../cli-framework/index.js";
import type { AppContext } from "./types.js";
import { createAppContext } from "./loader.js";
import { homeScreen } from "./screens/home.js";
import { issuesScreen } from "./screens/issues.js";
import { issueDetailScreen } from "./screens/issue-detail.js";
import { whyScreen } from "./screens/why.js";
import { summaryScreen } from "./screens/summary.js";
import { scanningScreen } from "./screens/scanning.js";

export async function runProjectDoctorApp(projectPath: string): Promise<void> {
  // Show initial loading
  blank();
  muted("Scanning project...");

  // Create initial context by scanning project
  const context = await createAppContext(projectPath);

  const config: AppConfig<AppContext> = {
    name: "project-doctor",
    context,
    screens: [
      homeScreen,
      issuesScreen,
      issueDetailScreen,
      whyScreen,
      summaryScreen,
      scanningScreen,
    ],
    initialScreen: "home",

    onExit: (ctx) => {
      // Show exit summary if any work was done
      const { fixed, disabled, skipped } = ctx.stats;
      if (fixed > 0 || disabled > 0 || skipped > 0) {
        blank();
        divider();
        blank();
        if (fixed > 0) text(`\x1b[32m✓\x1b[0m ${fixed} fixed`);
        if (disabled > 0) text(`\x1b[33m⊘\x1b[0m ${disabled} disabled`);
        if (skipped > 0) text(`\x1b[90m→\x1b[0m ${skipped} skipped`);
      }
      blank();
    },

    onEsc: (ctx, screenId) => {
      // ESC on home exits
      if (screenId === "home") {
        return "exit";
      }
      // ESC on issue-detail goes back to issues list
      if (screenId === "issue-detail" || screenId === "why") {
        return "back";
      }
      return "back";
    },
  };

  await runApp(config);
}
