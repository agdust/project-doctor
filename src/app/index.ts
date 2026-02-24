/**
 * Project Doctor App
 *
 * Multi-screen CLI app for project health checking and fixing.
 */

import { runApp, type AppConfig } from "../cli-framework/index.js";
import { blank, text, muted, divider, colors } from "../cli-framework/index.js";
import type { AppContext } from "./types.js";
import { createAppContext } from "./loader.js";
import { ensureGitSafety } from "../utils/git-safety.js";
import { homeScreen } from "./screens/home.js";
import { issuesScreen } from "./screens/issues.js";
import { overviewScreen } from "./screens/overview.js";
import { overviewDetailScreen } from "./screens/overview-detail.js";
import { issueDetailScreen } from "./screens/issue-detail.js";
import { fixOptionsScreen } from "./screens/fix-options.js";
import { whyScreen } from "./screens/why.js";
import { summaryScreen } from "./screens/summary.js";
import { scanningScreen } from "./screens/scanning.js";
import { configScreen } from "./screens/config.js";
import { projectTypeScreen } from "./screens/project-type.js";
import { aboutConfigScreen } from "./screens/about-config.js";
import { categoriesScreen } from "./screens/categories.js";
import { aboutScreen } from "./screens/about.js";
import { manualChecklistScreen } from "./screens/manual-checklist.js";
import { manualCheckDetailScreen } from "./screens/manual-check-detail.js";

export async function runProjectDoctorApp(projectPath: string): Promise<void> {
  // Check git safety before proceeding
  const safeToRun = await ensureGitSafety(projectPath);
  if (!safeToRun) {
    process.exit(0);
  }

  // Show initial loading
  blank();
  muted("Scanning project...");

  // Create initial context by scanning project
  const context = await createAppContext(projectPath);

  const config: AppConfig<AppContext> = {
    name: "project-doctor",
    displayName: (ctx) => `Project Doctor: ${colors.cyan(ctx.projectName)}`,
    context,
    screens: [
      homeScreen,
      issuesScreen,
      overviewScreen,
      overviewDetailScreen,
      issueDetailScreen,
      fixOptionsScreen,
      whyScreen,
      summaryScreen,
      scanningScreen,
      configScreen,
      projectTypeScreen,
      aboutConfigScreen,
      categoriesScreen,
      aboutScreen,
      manualChecklistScreen,
      manualCheckDetailScreen,
    ],
    initialScreen: "home",

    onExit: (ctx) => {
      // Show exit summary if any work was done
      const { fixed, muted: mutedCount, disabled, skipped } = ctx.stats;
      if (fixed > 0 || mutedCount > 0 || disabled > 0 || skipped > 0) {
        blank();
        divider();
        blank();
        if (fixed > 0) text(`${colors.green("✓")} ${fixed} fixed`);
        if (mutedCount > 0) text(`${colors.yellow("⏸")} ${mutedCount} muted`);
        if (disabled > 0) text(`${colors.yellow("⊘")} ${disabled} disabled`);
        if (skipped > 0) text(`${colors.dim("→")} ${skipped} skipped`);
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
