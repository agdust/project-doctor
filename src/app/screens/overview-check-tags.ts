/**
 * Overview Check Tags Screen
 *
 * Shows the tags of a selected failed check.
 * Each tag can be selected to navigate to the tag detail screen.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action, blank, title, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";

export const overviewCheckTagsScreen: Screen<AppContext> = {
  id: SCREEN.overviewCheckTags,
  parent: SCREEN.overviewDetail,

  render: (ctx) => {
    const check = ctx.failedChecks[ctx.selectedOverviewIndex];
    if (check === undefined) {
      muted("Check not found");
      blank();
      return;
    }

    title(`Tags: ${check.name}`);
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const check = ctx.failedChecks[ctx.selectedOverviewIndex];
    if (check === undefined) {
      return [];
    }

    return check.tags.map((tag) =>
      action(`tag-${tag}`, tag, (c) => {
        c.selectedTag = tag;
        return SCREEN.tagDetail;
      }),
    );
  },
};
