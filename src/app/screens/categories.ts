/**
 * Categories Screen
 *
 * Toggle check categories on/off.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, title, muted, text } from "../../cli-framework/index.js";
import { updateConfig, isTagOff } from "../../config/loader.js";
import type { AppContext } from "../types.js";

const CATEGORIES = [
  { tag: "required", label: "Required", description: "Essential checks" },
  { tag: "recommended", label: "Recommended", description: "Best practices" },
  { tag: "opinionated", label: "Opinionated", description: "Style preferences" },
] as const;

export const categoriesScreen: Screen<AppContext> = {
  id: "categories",
  parent: "config",

  render: (ctx) => {
    title("Control Categories");
    blank();
    muted("Toggle categories to enable or disable groups of checks.");
    blank();

    for (const cat of CATEGORIES) {
      const isOff = isTagOff(ctx.global.config, cat.tag);
      const status = isOff ? "\x1b[90m[ ]\x1b[0m" : "\x1b[32m[✓]\x1b[0m";
      text(`  ${status} ${cat.label}`);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const opts: Option<AppContext>[] = [];

    for (const cat of CATEGORIES) {
      const isOff = isTagOff(ctx.global.config, cat.tag);
      const actionLabel = isOff ? `Enable ${cat.label}` : `Disable ${cat.label}`;

      opts.push(
        action(`toggle-${cat.tag}`, actionLabel, async (c) => {
          const newSeverity = isOff ? "error" : "off";
          await updateConfig(c.projectPath, {
            tags: { [cat.tag]: newSeverity },
          });
          // Update local config
          c.global.config.tags[cat.tag] = newSeverity;
          // Stay on screen to show updated state
          return undefined;
        }, cat.description)
      );
    }

    return opts;
  },
};
