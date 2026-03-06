/**
 * About Config Screen
 *
 * Information about categories, tags, and checks.
 */

import { bold, dim, red, yellow, cyan, green } from "../../utils/colors.js";
import type { Screen } from "../../cli-framework/index.js";
import { blank, title, text, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const aboutConfigScreen: Screen<AppContext> = {
  id: SCREEN.aboutConfig,
  parent: SCREEN.config,

  render: () => {
    title("About Configuration");
    blank();

    text(bold("Config File"));
    blank();
    text("Settings are stored in .project-doctor/config.json5", 4);
    blank();

    text(bold("Tags"));
    blank();

    muted("Checks can be filtered by tags", 2);
    blank();

    text(cyan("By importance level:"));
    blank();

    text(`${red("Required")}      Essential. Ignoring this might lad to bugs and issues`, 4);
    text(`${yellow("Recommended")}   Best practices, highly suggested for better code quality`, 4);
    text(`${dim("Opinionated")}   Even more strict rules, yet you may find them "too much"`, 4);
    blank();

    text(cyan("By scope:"));
    text("universal, node, typescript", 4);
    blank();

    text(cyan("By tool:"));
    text(`tool:eslint, tool:prettier, tool:knip, etc.`, 4);
    blank();
    blank();

    text(bold("Config values"));
    blank();

    muted("You can manage checks or tags just like eslint rules");
    blank();

    text(`${red('"off"')} to disable`, 4);
    text(`${green('"error"')} to enable`, 4);
    text(`${green('["error", { config: values }]')} to enable and configure, where applicable`, 4);
    text(`${yellow('"mute-until-YYYY-MM-DD"')} to mute until certain date, after it consider this as "error"`, 4);
    blank();
  },

  options: () => {
    // No options - just back navigation
    return [];
  },
};
