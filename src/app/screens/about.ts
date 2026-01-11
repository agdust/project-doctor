/**
 * About Screen
 *
 * Shows project goals, values, and usage information.
 */

import type { Screen } from "../../cli-framework/index.js";
import { blank, text, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const aboutScreen: Screen<AppContext> = {
  id: "about",
  parent: "home",

  render: () => {
    text("\x1b[1mProject Doctor\x1b[0m");
    muted("Health checks for Node.js projects");
    blank();

    text("\x1b[1mGoals\x1b[0m");
    text("  Detect configuration issues early");
    text("  Enforce best practices consistently");
    text("  Reduce time spent on project setup");
    blank();

    text("\x1b[1mValues\x1b[0m");
    text("  Opinionated but configurable");
    text("  Fix issues, not just report them");
    text("  Minimal noise, actionable output");
    blank();

    text("\x1b[1mUsage\x1b[0m");
    text("  project-doctor          Interactive wizard");
    text("  project-doctor run      Run checks (CI mode)");
    text("  project-doctor overview Show all check results");
    text("  project-doctor init     Create config file");
    blank();

    muted("https://github.com/anthropics/project-doctor");
    blank();
  },

  options: () => [],
};
