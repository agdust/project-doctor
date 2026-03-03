/**
 * CLI Framework - Option helper functions
 *
 * Factory functions for creating options (reduces boilerplate in screen definitions).
 */

import type { ActionOption, NavOption, Separator } from "./types.js";

const BACK_VALUE = "__back__";

/** Create an action option */
export function action<TCtx>(
  value: string,
  label: string,
  run: (ctx: TCtx) => Promise<string | undefined> | string | undefined,
  description?: string,
): ActionOption<TCtx> {
  return { type: "action", value, label, run, description };
}

/** Create a navigation option */
export function nav(
  value: string,
  label: string,
  to: string,
  opts?: { description?: string; badge?: string },
): NavOption {
  return { type: "nav", value, label, to, ...opts };
}

/** Create a separator */
export function separator(label?: string): Separator {
  return { type: "separator", label };
}

/** Create a back option (usually auto-added) */
export function back(): NavOption {
  return { type: "nav", value: BACK_VALUE, label: "← Back", to: BACK_VALUE };
}
