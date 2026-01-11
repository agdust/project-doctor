/**
 * About Config Screen
 *
 * Information about categories, tags, and checks.
 */

import type { Screen } from "../../cli-framework/index.js";
import { blank, title, text, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const aboutConfigScreen: Screen<AppContext> = {
  id: "about-config",

  render: () => {
    title("About Configuration");
    blank();

    text("\x1b[1mCategories\x1b[0m");
    muted("Checks are grouped by importance level:", 0);
    blank();
    text("  \x1b[31mRequired\x1b[0m      Essential for a healthy project");
    text("  \x1b[33mRecommended\x1b[0m   Best practices, highly suggested");
    text("  \x1b[90mOpinionated\x1b[0m   Style preferences, optional");
    blank();

    text("\x1b[1mTags\x1b[0m");
    muted("Checks can be filtered by tags:", 0);
    blank();
    text("  \x1b[36mScope\x1b[0m         universal, node, typescript");
    text("  \x1b[36mFramework\x1b[0m     framework:svelte, framework:react, etc.");
    text("  \x1b[36mTool\x1b[0m          tool:eslint, tool:prettier, tool:knip, etc.");
    blank();

    text("\x1b[1mConfig File\x1b[0m");
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
