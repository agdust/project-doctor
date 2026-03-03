/**
 * About Screen
 *
 * Shows project goals, values, and usage information.
 */

import { bold, dim } from "../../utils/colors.js";
import type { Screen } from "../../cli-framework/index.js";
import { blank, text, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const aboutScreen: Screen<AppContext> = {
  id: SCREEN.about,
  parent: SCREEN.home,

  render: () => {
    text(bold("Project Doctor"));
    muted("Health checks for your projects");
    blank();

    text(bold("Goals"));
    text("  Detect configuration issues early");
    text("  Enforce best practices consistently");
    text("  Reduce time spent on project setup");
    text("  Track issues over the time");
    blank();

    text(bold("Values"));
    text("  Opinionated, no configuration required");
    text("  Fix issues, not just report them");
    text("  Minimal noise, actionable output");
    text("  Convenient, all you info you need is inside one simple cli");
    blank();

    text(bold("Controls"));
    text(`  ${dim("↑/↓")}   Navigate options`);
    text(`  ${dim("Enter")} Select option`);
    text(`  ${dim("Esc")}   Go back / Cancel`);
    text(`  ${dim("Space")} Toggle checkbox`);
    blank();

    text(bold("CLI Usage"));
    text("  project-doctor          Interactive wizard");
    blank();

    muted("https://github.com/anthropics/project-doctor");
    blank();
  },

  options: () => [],
};
