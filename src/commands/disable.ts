/**
 * Disable command - Disable checks, tags, or groups permanently
 *
 * Usage:
 *   project-doctor disable check <check-name> [path]
 *   project-doctor disable tag <tag-name> [path]
 *   project-doctor disable group <group-name> [path]
 */

import { toggleCheck, toggleTag, toggleGroup } from "./config-toggle.js";

export async function runDisableCheck(projectPath: string, checkName: string): Promise<void> {
  await toggleCheck(projectPath, checkName, "disable");
}

export async function runDisableTag(projectPath: string, tagName: string): Promise<void> {
  await toggleTag(projectPath, tagName, "disable");
}

export async function runDisableGroup(projectPath: string, groupName: string): Promise<void> {
  await toggleGroup(projectPath, groupName, "disable");
}
