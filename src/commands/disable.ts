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
import { RED, RESET } from "../utils/colors.js";

/**
 * Disable a specific check permanently.
 *
 * @param projectPath - Absolute path to the project directory
 * @param checkName - Name of the check to disable
 */
export async function runDisableCheck(
  projectPath: string,
  checkName: string
): Promise<void> {
  const validChecks = getValidCheckNames();

  if (!validChecks.has(checkName)) {
    console.error(`${RED}Error: Unknown check "${checkName}".${RESET}`);
    console.error(`Run "project-doctor list" to see available checks.`);
    process.exit(2);
  }

  await setCheckSeverity(projectPath, checkName, "off");
  console.log(`Disabled check: ${checkName}`);
}

/**
 * Disable all checks with a specific tag.
 *
 * @param projectPath - Absolute path to the project directory
 * @param tagName - Name of the tag to disable
 */
export async function runDisableTag(
  projectPath: string,
  tagName: string
): Promise<void> {
  const validTags = getValidTagNames();

  if (!validTags.has(tagName)) {
    console.error(`${RED}Error: Unknown tag "${tagName}".${RESET}`);
    console.error(`Valid tags: ${Array.from(validTags).join(", ")}`);
    process.exit(2);
  }

  await setTagSeverity(projectPath, tagName, "off");
  console.log(`Disabled tag: ${tagName}`);
}

/**
 * Disable an entire check group.
 *
 * @param projectPath - Absolute path to the project directory
 * @param groupName - Name of the group to disable
 */
export async function runDisableGroup(
  projectPath: string,
  groupName: string
): Promise<void> {
  const validGroups = getValidGroupNames();

  if (!validGroups.has(groupName)) {
    console.error(`${RED}Error: Unknown group "${groupName}".${RESET}`);
    console.error(`Valid groups: ${Array.from(validGroups).join(", ")}`);
    process.exit(2);
  }

  await setGroupSeverity(projectPath, groupName, "off");
  console.log(`Disabled group: ${groupName}`);
}
