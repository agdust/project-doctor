/**
 * Disable command - Disable checks, tags, or groups permanently
 *
 * Usage:
 *   project-doctor disable check <check-name> [path]
 *   project-doctor disable tag <tag-name> [path]
 *   project-doctor disable group <group-name> [path]
 */

import { setCheckSeverity, setTagSeverity, setGroupSeverity } from "../config/loader.js";
import {
  getValidCheckNames,
  getValidGroupNames,
  getValidTagNames,
} from "../utils/checks.js";

export async function runDisableCheck(
  projectPath: string,
  checkName: string
): Promise<void> {
  const validChecks = getValidCheckNames();

  if (!validChecks.has(checkName)) {
    console.error(`\x1b[31mError: Unknown check "${checkName}".\x1b[0m`);
    console.error(`Run "project-doctor list" to see available checks.`);
    process.exit(2);
  }

  await setCheckSeverity(projectPath, checkName, "off");
  console.log(`Disabled check: ${checkName}`);
}

export async function runDisableTag(
  projectPath: string,
  tagName: string
): Promise<void> {
  const validTags = getValidTagNames();

  if (!validTags.has(tagName)) {
    console.error(`\x1b[31mError: Unknown tag "${tagName}".\x1b[0m`);
    console.error(`Valid tags: ${Array.from(validTags).join(", ")}`);
    process.exit(2);
  }

  await setTagSeverity(projectPath, tagName, "off");
  console.log(`Disabled tag: ${tagName}`);
}

export async function runDisableGroup(
  projectPath: string,
  groupName: string
): Promise<void> {
  const validGroups = getValidGroupNames();

  if (!validGroups.has(groupName)) {
    console.error(`\x1b[31mError: Unknown group "${groupName}".\x1b[0m`);
    console.error(`Valid groups: ${Array.from(validGroups).join(", ")}`);
    process.exit(2);
  }

  await setGroupSeverity(projectPath, groupName, "off");
  console.log(`Disabled group: ${groupName}`);
}
