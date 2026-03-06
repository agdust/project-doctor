/**
 * Tag Checks Screen
 *
 * Read-only scrollable list of checks belonging to the selected tag.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action, blank, title, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { getChecksForTag } from "./shared.js";

export const tagChecksScreen: Screen<AppContext> = {
  id: SCREEN.tagChecks,
  parent: SCREEN.tagDetail,

  render: (ctx) => {
    const tag = ctx.selectedTag;
    const checks = getChecksForTag(tag);

    title(`Checks with tag: ${tag}`);
    blank();

    if (checks.length === 0) {
      muted("No checks use this tag.");
    } else {
      muted(`${checks.length} checks`);
    }
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const tag = ctx.selectedTag;
    const checks = getChecksForTag(tag);

    return checks.map((check) => {
      return action(`check-${check.name}`, check.name, () => undefined, check.description);
    });
  },
};
