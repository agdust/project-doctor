/**
 * Enable command - Re-enable disabled checks, tags, or groups
 *
 * Usage:
 *   project-doctor enable check <check-name> [path]
 *   project-doctor enable tag <tag-name> [path]
 *   project-doctor enable group <group-name> [path]
 */

import { setCheckSeverity, setTagSeverity, setGroupSeverity } from "../config/loader.js";
import {
  getValidCheckNames,
  getValidGroupNames,
  getValidTagNames,
} from "../utils/checks.js";
import { RED, RESET } from "../utils/colors.js";

/**
 * Re-enable a previously disabled check.
 *
 * @param projectPath - Absolute path to the project directory
 * @param checkName - Name of the check to enable
 */
export async function runEnableCheck(
  projectPath: string,
  checkName: string
): Promise<void> {
  const validChecks = getValidCheckNames();

  if (!validChecks.has(checkName)) {
    console.error(`${RED}Error: Unknown check "${checkName}".${RESET}`);
    console.error(`Run "project-doctor list" to see available checks.`);
    process.exit(2);
  }

  await setCheckSeverity(projectPath, checkName, "error");
  console.log(`Enabled check: ${checkName}`);
}

/**
 * Re-enable all checks with a specific tag.
 *
 * @param projectPath - Absolute path to the project directory
 * @param tagName - Name of the tag to enable
 */
export async function runEnableTag(
  projectPath: string,
  tagName: string
): Promise<void> {
  const validTags = getValidTagNames();

  if (!validTags.has(tagName)) {
    console.error(`${RED}Error: Unknown tag "${tagName}".${RESET}`);
    console.error(`Valid tags: ${Array.from(validTags).join(", ")}`);
    process.exit(2);
  }

  await setTagSeverity(projectPath, tagName, "error");
  console.log(`Enabled tag: ${tagName}`);
}

/**
 * Re-enable an entire check group.
 *
 * @param projectPath - Absolute path to the project directory
 * @param groupName - Name of the group to enable
 */
export async function runEnableGroup(
  projectPath: string,
  groupName: string
): Promise<void> {
  const validGroups = getValidGroupNames();

  if (!validGroups.has(groupName)) {
    console.error(`${RED}Error: Unknown group "${groupName}".${RESET}`);
    console.error(`Valid groups: ${Array.from(validGroups).join(", ")}`);
    process.exit(2);
  }

  await setGroupSeverity(projectPath, groupName, "error");
  console.log(`Enabled group: ${groupName}`);
}
