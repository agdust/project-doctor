/**
 * Shared Screen Utilities
 *
 * Common logic used across multiple screens to avoid duplication.
 */

import { blank, muted, success, error, action } from "../../cli-framework/index.js";
import { setCheckSeverity, setTagSeverity, isTagOff } from "../../config/loader.js";
import { createMuteUntil, isMuteUntilActive } from "../../config/severity.js";
import type { Severity } from "../../config/types.js";
import { getErrorMessage } from "../../utils/errors.js";
import { copyToClipboard } from "../../utils/clipboard.js";
import { getValidGroupNames } from "../../utils/checks.js";
import { listChecks } from "../../registry.js";
import { TAG } from "../../types.js";
import type { CheckTag, FixResult } from "../../types.js";
import type { ActionOption } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { rescanProject } from "../loader.js";

/** Tracks which copy-URL actions have been triggered (for "Copied!" label feedback) */
const copiedActions = new Set<string>();

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
 * Create an action handler that runs a fix and reports the result.
 *
 * Centralises the try / success / error / catch boilerplate shared by
 * overview-detail, issue-detail, and fix-options screens.
 */
export function createFixHandler(options: {
  runFix: () => Promise<FixResult> | FixResult;
  onSuccess?: (ctx: AppContext) => void;
  getNextScreen: (ctx: AppContext) => string | undefined;
}): (ctx: AppContext) => Promise<string | undefined> {
  return async (c) => {
    try {
      const result = await options.runFix();
      blank();
      if (result.success) {
        success(result.message, 3);
        c.stats.fixed++;
        options.onSuccess?.(c);
      } else {
        error(result.message, 3);
      }
    } catch (error_) {
      error(getErrorMessage(error_), 3);
    }
    blank();
    return options.getNextScreen(c);
  };
}

/**
 * Create mute/disable action options for a check.
 *
 * @param getCheckName - Function to get the check name from context
 * @param onComplete - Function called after mute/disable, returns next screen ID
 * @param extraOnMute - Optional callback for additional state updates on mute
 * @param extraOnDisable - Optional callback for additional state updates on disable
 * @param writeSeverity - Optional custom severity writer (defaults to setCheckSeverity)
 */
export function createMuteDisableActions(options: {
  getCheckName: (ctx: AppContext) => string;
  onComplete: (ctx: AppContext) => string | undefined;
  extraOnMute?: (ctx: AppContext) => void;
  extraOnDisable?: (ctx: AppContext) => void;
  writeSeverity?: (projectPath: string, checkName: string, severity: Severity) => Promise<void>;
}): ActionOption<AppContext>[] {
  const { getCheckName, onComplete, extraOnMute, extraOnDisable } = options;
  const writeSeverity = options.writeSeverity ?? setCheckSeverity;

  return [
    action("mute-2w", "Mute for 2 weeks", async (c) => {
      try {
        const muteDate = new Date();
        muteDate.setDate(muteDate.getDate() + MUTE_DURATIONS.TWO_WEEKS_DAYS);
        await writeSeverity(c.projectPath, getCheckName(c), createMuteUntil(muteDate));
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
        await writeSeverity(c.projectPath, getCheckName(c), createMuteUntil(muteDate));
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
        await writeSeverity(c.projectPath, getCheckName(c), "off");
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

/**
 * Create copy-URL action options for tool docs and source references.
 * Only includes actions for non-null URLs. Returns undefined to stay on current screen.
 */
export function createCopyUrlActions(item: {
  toolUrl: string | null;
  sourceUrl: string | null;
}): ActionOption<AppContext>[] {
  const actions: ActionOption<AppContext>[] = [];

  pushCopyAction(actions, item.toolUrl, "copy-tool-url", "Copy docs URL");
  pushCopyAction(actions, item.sourceUrl, "copy-source-url", "Copy source URL");

  copiedActions.clear();

  return actions;
}

function pushCopyAction(
  actions: ActionOption<AppContext>[],
  url: string | null,
  id: string,
  baseLabel: string,
): void {
  if (url === null) {
    return;
  }
  const label = copiedActions.has(id) ? `${baseLabel} (Copied!)` : baseLabel;
  actions.push(
    action(id, label, async () => {
      const ok = await copyToClipboard(url);
      if (ok) {
        copiedActions.add(id);
      } else {
        blank();
        error("Failed to copy — no clipboard tool available", 3);
        blank();
      }
      return undefined;
    }),
  );
}

// ============================================================================
// Tag Utilities
// ============================================================================

export type TagStatus = "enabled" | "disabled" | "muted";

/** Determine effective status of a tag from config */
export function getTagStatus(tagName: string, ctx: AppContext): TagStatus {
  if (isTagOff(ctx.global.config, tagName)) {
    return "disabled";
  }
  const severity = ctx.global.config.tags[tagName];
  if (severity && isMuteUntilActive(severity)) {
    return "muted";
  }
  return "enabled";
}

/** Get checks that belong to a tag (including group-as-tag matching) */
export function getChecksForTag(
  tag: string,
): { name: string; group: string; description: string; tags: CheckTag[] }[] {
  const allChecks = listChecks();
  const groupNames = getValidGroupNames();
  const isGroup = groupNames.has(tag);

  return allChecks.filter((c) => {
    if (isGroup) {
      return c.group === tag || c.tags.includes(tag as never);
    }
    return c.tags.includes(tag as never);
  });
}

/** Derive the display section for a tag from the TAG constant structure */
export function getTagSection(tag: string): string {
  // Importance tags
  if (tag === TAG.required || tag === TAG.recommended || tag === TAG.opinionated) {
    return "Importance";
  }

  // Scope tags
  if (tag === TAG.universal || tag === TAG.node || tag === TAG.typescript) {
    return "Scope";
  }

  // Grouped tags — section from prefix
  for (const [key, value] of Object.entries(TAG)) {
    if (typeof value === "object" && (Object.values(value) as string[]).includes(tag)) {
      return key.charAt(0).toUpperCase() + key.slice(1);
    }
  }

  // Group names used as tags
  if (getValidGroupNames().has(tag)) {
    return "Group";
  }

  return "Other";
}

/**
 * Create mute/disable/enable action options for a tag.
 *
 * Tags use setTagSeverity (groups are stored in the same tags record).
 */
export function createTagToggleActions(options: {
  getTagName: (ctx: AppContext) => string;
  onComplete: (ctx: AppContext) => string | undefined;
}): ActionOption<AppContext>[] {
  const { getTagName, onComplete } = options;

  async function applyAndRescan(
    ctx: AppContext,
    severity: "off" | "error" | `mute-until-${string}`,
    message: string,
  ): Promise<string | undefined> {
    const tag = getTagName(ctx);
    try {
      await setTagSeverity(ctx.projectPath, tag, severity);
      ctx.global.config.tags[tag] = severity;
      blank();
      muted(message, 3);
      await rescanProject(ctx);
    } catch (error_) {
      error(getErrorMessage(error_), 3);
    }
    return onComplete(ctx);
  }

  return [
    action("mute-2w", "Mute for 2 weeks", async (c) => {
      const muteDate = new Date();
      muteDate.setDate(muteDate.getDate() + MUTE_DURATIONS.TWO_WEEKS_DAYS);
      return applyAndRescan(c, createMuteUntil(muteDate), "Muted for 2 weeks");
    }),
    action("mute-2m", "Mute for 2 months", async (c) => {
      const muteDate = new Date();
      muteDate.setMonth(muteDate.getMonth() + MUTE_DURATIONS.TWO_MONTHS);
      return applyAndRescan(c, createMuteUntil(muteDate), "Muted for 2 months");
    }),
    action("disable", "Disable", async (c) => {
      return applyAndRescan(c, "off", "Disabled");
    }),
  ];
}

/**
 * Create an enable action option for a tag.
 */
export function createTagEnableAction(options: {
  getTagName: (ctx: AppContext) => string;
  onComplete: (ctx: AppContext) => string | undefined;
}): ActionOption<AppContext> {
  const { getTagName, onComplete } = options;

  return action("enable", "Enable", async (c) => {
    const tag = getTagName(c);
    try {
      await setTagSeverity(c.projectPath, tag, "error");
      c.global.config.tags[tag] = "error";
      blank();
      muted("Enabled", 3);
      await rescanProject(c);
    } catch (error_) {
      error(getErrorMessage(error_), 3);
    }
    return onComplete(c);
  });
}
