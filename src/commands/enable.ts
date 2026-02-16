/**
 * Enable command - Re-enable disabled checks, tags, or groups
 *
 * Usage:
 *   project-doctor enable check <check-name> [path]
 *   project-doctor enable tag <tag-name> [path]
 *   project-doctor enable group <group-name> [path]
 */

import { toggleCheck, toggleTag, toggleGroup } from "./config-toggle.js";

export async function runEnableCheck(projectPath: string, checkName: string): Promise<void> {
  await toggleCheck(projectPath, checkName, "enable");
}

export async function runEnableTag(projectPath: string, tagName: string): Promise<void> {
  await toggleTag(projectPath, tagName, "enable");
}

export async function runEnableGroup(projectPath: string, groupName: string): Promise<void> {
  await toggleGroup(projectPath, groupName, "enable");
}
