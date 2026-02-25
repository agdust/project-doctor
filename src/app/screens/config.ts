/**
 * Config Screen
 *
 * Main configuration menu.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, blank, title, muted  } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const configScreen: Screen<AppContext> = {
  id: "config",
  parent: "home",

  render: () => {
    title("Configuration");
    blank();
    muted("Manage how checks are run and filtered.");
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const typeLabel = ctx.global.config.projectType === "js" ? "JavaScript/Node" : "Generic";

    return [
      nav("about-config", "About config", "about-config", {
        description: "Learn about categories, tags, and checks",
      }),
      nav("project-type", "Project type", "project-type", {
        description: `Currently: ${typeLabel}`,
      }),
      nav("categories", "Control categories", "categories", {
        description: "Enable or disable check categories",
      }),
    ];
  },
};
