/**
 * Scanning Screen
 *
 * Shows loading state while scanning project.
 * Auto-navigates to home after scan completes.
 */

import type { Screen } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, muted, success } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { rescanProject } from "../loader.js";

export const scanningScreen: Screen<AppContext> = {
  id: "scanning",

  render: (ctx) => {
    if (ctx.scanned) {
      success("Scan complete");
    } else {
      muted("Scanning project...");
    }
    blank();
  },

  options: (ctx) => [
    action("continue", ctx.scanned ? "Continue" : "...", async () => "home"),
  ],

  onEnter: async (ctx) => {
    ctx.scanned = false;
    await rescanProject(ctx);
    ctx.scanned = true;
  },
};
