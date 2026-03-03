/**
 * Config Screen
 *
 * Main configuration menu.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, blank, title, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const configScreen: Screen<AppContext> = {
  id: SCREEN.config,
  parent: SCREEN.home,

  render: () => {
    title("Configuration");
    blank();
    muted("Manage how checks are run and filtered.");
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const typeLabel = ctx.global.config.projectType === "js" ? "JavaScript/Node" : "Generic";

    return [
      nav("about-config", "About config", SCREEN.aboutConfig, {
        description: "Learn about categories, tags, and checks",
      }),
      nav("project-type", "Project type", SCREEN.projectType, {
        description: `Currently: ${typeLabel}`,
      }),
      nav("categories", "Control categories", SCREEN.categories, {
        description: "Enable or disable check categories",
      }),
    ];
  },
};
