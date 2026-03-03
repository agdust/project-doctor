/**
 * Shared Screen Utilities
 *
 * Common logic used across multiple screens to avoid duplication.
 */

import { blank, muted, error, action } from "../../cli-framework/index.js";
import { setCheckSeverity } from "../../config/loader.js";
import { createSkipUntil } from "../../config/severity.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { ActionOption } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

/** Mute/disable duration constants */
export const MUTE_DURATIONS = {
  TWO_WEEKS_DAYS: 14,
  TWO_MONTHS: 2,
} as const;

/**
 * Advance to the next issue in the fixing flow.
 * Returns "summary" when all issues are done, or undefined to stay on issue-detail.
 */
export function moveToNextIssue(ctx: AppContext): string | undefined {
  ctx.currentIssueIndex++;

  if (ctx.currentIssueIndex >= ctx.issues.length) {
    return SCREEN.summary;
  }

  return undefined;
}

/**
 * Create mute/disable action options for a check.
 *
 * @param getCheckName - Function to get the check name from context
 * @param onComplete - Function called after mute/disable, returns next screen ID
 * @param extraOnMute - Optional callback for additional state updates on mute
 * @param extraOnDisable - Optional callback for additional state updates on disable
 */
export function createMuteDisableActions(options: {
  getCheckName: (ctx: AppContext) => string;
  onComplete: (ctx: AppContext) => string | undefined;
  extraOnMute?: (ctx: AppContext) => void;
  extraOnDisable?: (ctx: AppContext) => void;
}): ActionOption<AppContext>[] {
  const { getCheckName, onComplete, extraOnMute, extraOnDisable } = options;

  return [
    action("mute-2w", "Mute for 2 weeks", async (c) => {
      try {
        const muteDate = new Date();
        muteDate.setDate(muteDate.getDate() + MUTE_DURATIONS.TWO_WEEKS_DAYS);
        await setCheckSeverity(c.projectPath, getCheckName(c), createSkipUntil(muteDate));
        blank();
        muted("Muted for 2 weeks", 3);
        c.stats.muted++;
        extraOnMute?.(c);
      } catch (error_) {
        error(getErrorMessage(error_), 3);
      }
      blank();
      return onComplete(c);
    }),
    action("mute-2m", "Mute for 2 months", async (c) => {
      try {
        const muteDate = new Date();
        muteDate.setMonth(muteDate.getMonth() + MUTE_DURATIONS.TWO_MONTHS);
        await setCheckSeverity(c.projectPath, getCheckName(c), createSkipUntil(muteDate));
        blank();
        muted("Muted for 2 months", 3);
        c.stats.muted++;
        extraOnMute?.(c);
      } catch (error_) {
        error(getErrorMessage(error_), 3);
      }
      blank();
      return onComplete(c);
    }),
    action("disable", "Disable", async (c) => {
      try {
        await setCheckSeverity(c.projectPath, getCheckName(c), "off");
        blank();
        muted("Disabled permanently", 3);
        c.stats.disabled++;
        extraOnDisable?.(c);
      } catch (error_) {
        error(getErrorMessage(error_), 3);
      }
      blank();
      return onComplete(c);
    }),
  ];
}
