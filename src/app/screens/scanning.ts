/**
 * Scanning Screen
 *
 * Shows loading state while scanning project.
 * Auto-navigates to home after scan completes.
 */

import type { Screen } from "../../cli-framework/index.js";
import { action, blank, muted, success  } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { rescanProject } from "../loader.js";

export const scanningScreen: Screen<AppContext> = {
  id: "scanning",
  parent: "home",
  noBack: true, // Transient screen, no back during scan

  render: (ctx) => {
    if (ctx.scanned) {
      success("Scan complete");
    } else {
      muted("Scanning project...");
    }
    blank();
  },

  options: (ctx) => [action("continue", ctx.scanned ? "Continue" : "...", () => "home")],

  onEnter: async (ctx): Promise<string | undefined> => {
    ctx.scanned = false;
    await rescanProject(ctx);
    ctx.scanned = true;
    return undefined;
  },
};
