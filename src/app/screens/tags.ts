/**
 * Tags Screen
 *
 * Shows all tags with their enabled/disabled status.
 * Selecting a tag navigates to the tag detail screen.
 */

import { dim, green, yellow } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, separator, blank, title, muted, ICONS } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { getValidTagNames, getValidGroupNames } from "../../utils/checks.js";
import { getTagStatus, getTagSection, type TagStatus } from "./shared.js";

interface TagEntry {
  name: string;
  section: string;
}

/** Section display order */
const SECTION_ORDER = ["Importance", "Scope", "Tool", "Effort", "Source", "Other", "Group"];

/** Fixed ordering within the Importance section */
const IMPORTANCE_ORDER = ["required", "recommended", "opinionated"];

function getTagEntries(): TagEntry[] {
  const allTags = getValidTagNames();
  const groupNames = getValidGroupNames();

  const bySection = new Map<string, TagEntry[]>();

  for (const tag of allTags) {
    const section = getTagSection(tag);
    let list = bySection.get(section);
    if (!list) {
      list = [];
      bySection.set(section, list);
    }
    list.push({ name: tag, section });
  }

  // Add group names that aren't already in the tag set
  for (const group of groupNames) {
    if (!allTags.has(group)) {
      let list = bySection.get("Group");
      if (!list) {
        list = [];
        bySection.set("Group", list);
      }
      list.push({ name: group, section: "Group" });
    }
  }

  // Sort each section
  for (const [section, entries] of bySection) {
    if (section === "Importance") {
      entries.sort((a, b) => IMPORTANCE_ORDER.indexOf(a.name) - IMPORTANCE_ORDER.indexOf(b.name));
    } else {
      entries.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // Assemble in defined order
  const result: TagEntry[] = [];
  for (const section of SECTION_ORDER) {
    const entries = bySection.get(section);
    if (entries) {
      result.push(...entries);
    }
  }

  // Append any sections not in the predefined order
  for (const [section, entries] of bySection) {
    if (!SECTION_ORDER.includes(section)) {
      result.push(...entries);
    }
  }

  return result;
}

function tagStatusIcon(status: TagStatus): string {
  switch (status) {
    case "enabled": {
      return green(ICONS.pass);
    }
    case "disabled": {
      return dim(ICONS.disabled);
    }
    case "muted": {
      return yellow(ICONS.muted);
    }
  }
}

export const tagsScreen: Screen<AppContext> = {
  id: SCREEN.tags,
  parent: SCREEN.config,

  render: () => {
    title("Tags");
    blank();
    muted("Select a tag to view its checks or toggle it.");
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const entries = getTagEntries();
    const opts: Option<AppContext>[] = [];

    let currentSection = "";

    for (const entry of entries) {
      if (entry.section !== currentSection) {
        currentSection = entry.section;
        opts.push(separator(currentSection));
      }

      const status = getTagStatus(entry.name, ctx);
      const icon = tagStatusIcon(status);

      let statusLabel = "";
      if (status === "muted") {
        statusLabel = yellow(" (muted)");
      }
      if (status === "disabled") {
        statusLabel = dim(" (disabled)");
      }
      const label = `${icon}  ${entry.name}${statusLabel}`;

      opts.push(
        action(`tag-${entry.name}`, label, (c) => {
          c.selectedTag = entry.name;
          return SCREEN.tagDetail;
        }),
      );
    }

    return opts;
  },
};
