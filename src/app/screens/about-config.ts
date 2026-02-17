/**
 * About Config Screen
 *
 * Information about categories, tags, and checks.
 */

import { bold, dim, red, yellow, cyan } from "../../utils/colors.js";
import type { Screen } from "../../cli-framework/index.js";
import { blank, title, text, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const aboutConfigScreen: Screen<AppContext> = {
  id: "about-config",
  parent: "config",

  render: () => {
    title("About Configuration");
    blank();

    text(bold("Categories"));
    muted("Checks are grouped by importance level:", 0);
    blank();
    text(`  ${red("Required")}      Essential for a healthy project`);
    text(`  ${yellow("Recommended")}   Best practices, highly suggested`);
    text(`  ${dim("Opinionated")}   Style preferences, optional`);
    blank();

    text(bold("Tags"));
    muted("Checks can be filtered by tags:", 0);
    blank();
    text(`  ${cyan("Scope")}         universal, node, typescript`);
    text(`  ${cyan("Framework")}     framework:svelte, framework:react, etc.`);
    text(`  ${cyan("Tool")}          tool:eslint, tool:prettier, tool:knip, etc.`);
    blank();

    text(bold("Config File"));
    muted("Settings are stored in .project-doctor/config.json5", 0);
    blank();
    text("  You can disable checks, tags, or entire groups.");
    text("  Use 'skip-until-YYYY-MM-DD' to temporarily mute checks.");
    blank();
  },

  options: () => {
    // No options - just back navigation
    return [];
  },
};
