/**
 * Shared utilities for enable/disable commands
 */

import { setCheckSeverity, setTagSeverity, setGroupSeverity } from "../config/loader.js";
import { getValidCheckNames, getValidGroupNames, getValidTagNames } from "../utils/checks.js";
import { RED, RESET } from "../utils/colors.js";
import type { Severity } from "../config/types.js";

type ToggleAction = "enable" | "disable";

function getSeverity(action: ToggleAction): Severity {
  return action === "enable" ? "error" : "off";
}

function getActionPastTense(action: ToggleAction): string {
  return action === "enable" ? "Enabled" : "Disabled";
}

export async function toggleCheck(
  projectPath: string,
  checkName: string,
  action: ToggleAction,
): Promise<void> {
  const validChecks = getValidCheckNames();

  if (!validChecks.has(checkName)) {
    console.error(`${RED}Error: Unknown check "${checkName}".${RESET}`);
    console.error('Run "project-doctor list" to see available checks.');
    process.exit(2);
  }

  await setCheckSeverity(projectPath, checkName, getSeverity(action));
  console.log(`${getActionPastTense(action)} check: ${checkName}`);
}

export async function toggleTag(
  projectPath: string,
  tagName: string,
  action: ToggleAction,
): Promise<void> {
  const validTags = getValidTagNames();

  if (!validTags.has(tagName)) {
    console.error(`${RED}Error: Unknown tag "${tagName}".${RESET}`);
    console.error(`Valid tags: ${Array.from(validTags).join(", ")}`);
    process.exit(2);
  }

  await setTagSeverity(projectPath, tagName, getSeverity(action));
  console.log(`${getActionPastTense(action)} tag: ${tagName}`);
}

export async function toggleGroup(
  projectPath: string,
  groupName: string,
  action: ToggleAction,
): Promise<void> {
  const validGroups = getValidGroupNames();

  if (!validGroups.has(groupName)) {
    console.error(`${RED}Error: Unknown group "${groupName}".${RESET}`);
    console.error(`Valid groups: ${Array.from(validGroups).join(", ")}`);
    process.exit(2);
  }

  await setGroupSeverity(projectPath, groupName, getSeverity(action));
  console.log(`${getActionPastTense(action)} group: ${groupName}`);
}
