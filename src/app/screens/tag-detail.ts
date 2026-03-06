/**
 * Tag Detail Screen
 *
 * Shows tag status and allows toggling. Links to checks list.
 */

import { dim, green, yellow } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { nav, separator, blank, title, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import {
  getTagStatus,
  getChecksForTag,
  createTagToggleActions,
  createTagEnableAction,
} from "./shared.js";

export const tagDetailScreen: Screen<AppContext> = {
  id: SCREEN.tagDetail,
  parent: SCREEN.tags,

  render: (ctx) => {
    const tag = ctx.selectedTag;
    const status = getTagStatus(tag, ctx);

    title(`Tag: ${tag}`);
    blank();

    if (status === "enabled") {
      text(`Status: ${green("enabled")}`);
    } else if (status === "disabled") {
      text(`Status: ${dim("disabled")}`);
    } else {
      text(`Status: ${yellow("muted")}`);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const tag = ctx.selectedTag;
    const status = getTagStatus(tag, ctx);
    const checkCount = getChecksForTag(tag).length;

    const opts: Option<AppContext>[] = [
      nav("view-checks", "View checks", SCREEN.tagChecks, {
        badge: `${checkCount}`,
      }),
      separator(),
    ];

    const toggleOpts = {
      getTagName: (c: AppContext) => c.selectedTag,
      onComplete: () => SCREEN.tags,
    };

    if (status === "enabled") {
      opts.push(...createTagToggleActions(toggleOpts));
    } else {
      opts.push(createTagEnableAction(toggleOpts));
    }

    return opts;
  },
};
