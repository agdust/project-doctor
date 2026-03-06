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
    text("Detect configuration issues early", 4);
    text("Enforce best practices consistently", 4);
    text("Reduce time spent on project setup", 4);
    text("Track issues over the time", 4);
    blank();

    text(bold("Values"));
    text("Opinionated, no configuration required", 4);
    text("Fix issues, not just report them", 4);
    text("Minimal noise, actionable output", 4);
    text("Convenient, all you info you need is inside one simple cli", 4);
    blank();

    text(bold("Controls"));
    text(`${dim("↑/↓")}   Navigate options`, 4);
    text(`${dim("Enter")} Select option`, 4);
    text(`${dim("Esc")}   Go back / Cancel`, 4);
    text(`${dim("Space")} Toggle checkbox`, 4);
    blank();

    text(bold("CLI Usage"));
    text("project-doctor          Interactive wizard", 4);
    blank();

    muted("https://github.com/anthropics/project-doctor");
    blank();
  },

  options: () => [],
};
