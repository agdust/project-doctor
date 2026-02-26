/**
 * Categories Screen
 *
 * Toggle check categories on/off using checkbox prompt.
 */

import { checkbox } from "@inquirer/prompts";
import type { Screen } from "../../cli-framework/index.js";
import { clear, bigTitle, blank, muted, colors } from "../../cli-framework/index.js";
import { updateConfig, isTagOff } from "../../config/loader.js";
import type { AppContext } from "../types.js";
import { TAG } from "../../types.js";

const CATEGORIES = [
  { value: TAG.required, name: "Required", description: "Essential checks" },
  { value: TAG.recommended, name: "Recommended", description: "Best practices" },
  { value: TAG.opinionated, name: "Opinionated", description: "Style preferences" },
] as const;

export const categoriesScreen: Screen<AppContext> = {
  id: "categories",
  parent: "config",

  render: () => {},
  options: () => [],

  onEnter: async (ctx) => {
    // Clear and show header
    clear();
    bigTitle(`Project Doctor: ${colors.cyan(ctx.projectName)}`);
    blank();

    // Build choices with current state
    const choices = CATEGORIES.map((cat) => ({
      value: cat.value,
      name: cat.name,
      description: cat.description,
      checked: !isTagOff(ctx.global.config, cat.value),
    }));

    // Set up ESC key handling
    const ac = new AbortController();
    let escPressed = false;

    const onData = (data: Buffer) => {
      if (data[0] === 0x1b && data.length === 1) {
        escPressed = true;
        ac.abort();
      }
    };

    process.stdin.on("data", onData);

    try {
      const selected = await checkbox(
        {
          message: "Toggle categories (space to toggle, enter to save, esc to cancel)",
          choices,
          theme: { prefix: "" },
        },
        { signal: ac.signal },
      );

      // Update config based on selection
      const updates: Record<string, "off" | "error"> = {};
      for (const cat of CATEGORIES) {
        const isEnabled = selected.includes(cat.value);
        const wasEnabled = !isTagOff(ctx.global.config, cat.value);
        if (isEnabled !== wasEnabled) {
          updates[cat.value] = isEnabled ? "error" : "off";
          ctx.global.config.tags[cat.value] = updates[cat.value];
        }
      }

      if (Object.keys(updates).length > 0) {
        await updateConfig(ctx.projectPath, { tags: updates });
      }
    } catch {
      // User cancelled (Ctrl+C or ESC) - discard changes
      if (escPressed) {
        blank();
        muted("Cancelled", 3);
      }
    } finally {
      process.stdin.removeListener("data", onData);
    }

    // Return to config screen
    return "config";
  },
};
