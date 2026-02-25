/**
 * Config command - Show and set configuration values
 *
 * Usage:
 *   project-doctor config [path]              Show current configuration
 *   project-doctor config set project-type <js|generic> [path]   Set project type
 */

import { loadAndResolveConfig, setProjectType } from "../config/loader.js";
import type { ProjectType, Severity } from "../config/types.js";
import { isSkipUntil, parseSkipUntil } from "../config/types.js";
import { bold, dim, green, yellow, red } from "../utils/colors.js";

function formatSeverity(severity: Severity): string {
  if (severity === "off") {
    return dim("off");
  }
  if (isSkipUntil(severity)) {
    const date = parseSkipUntil(severity);
    if (date) {
      return yellow(`skip-until-${date.toISOString().split("T")[0]}`);
    }
    return dim(severity);
  }
  return green("error");
}

function formatProjectTypeSource(source: "config" | "detected", detectedFrom?: string): string {
  if (source === "config") {
    return dim("(from config)");
  }
  if (detectedFrom && detectedFrom !== "fallback") {
    return dim(`(auto-detected from ${detectedFrom})`);
  }
  return dim("(auto-detected)");
}

/**
 * Display current project configuration.
 *
 * Shows project type, configured checks, tags, and groups
 * with their current severity settings.
 *
 * @param projectPath - Absolute path to the project directory
 */
export async function runConfigShow(projectPath: string): Promise<void> {
  const resolved = await loadAndResolveConfig(projectPath);

  console.log();
  console.log(
    `${bold("Project Type:")} ${resolved.projectType} ${formatProjectTypeSource(resolved.projectTypeSource, resolved.projectTypeDetectedFrom)}`,
  );
  console.log();

  // Show checks configuration
  const checkEntries = Object.entries(resolved.checks);
  if (checkEntries.length > 0) {
    console.log(bold("Checks:"));
    for (const [name, severity] of checkEntries) {
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    console.log();
  } else {
    console.log(`${bold("Checks:")} ${dim("(none configured)")}`);
    console.log();
  }

  // Show tags configuration
  const tagEntries = Object.entries(resolved.tags);
  if (tagEntries.length > 0) {
    console.log(bold("Tags:"));
    for (const [name, severity] of tagEntries) {
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    console.log();
  } else {
    console.log(`${bold("Tags:")} ${dim("(none configured)")}`);
    console.log();
  }

  // Show groups configuration
  const groupEntries = Object.entries(resolved.groups);
  if (groupEntries.length > 0) {
    console.log(bold("Groups:"));
    for (const [name, severity] of groupEntries) {
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    console.log();
  } else {
    console.log(`${bold("Groups:")} ${dim("(none configured)")}`);
    console.log();
  }
}

/**
 * Set the project type in configuration.
 *
 * @param projectPath - Absolute path to the project directory
 * @param projectType - Project type: "js" or "generic"
 */
export async function runConfigSetProjectType(
  projectPath: string,
  projectType: string,
): Promise<void> {
  // Validate project type
  if (projectType !== "js" && projectType !== "generic") {
    console.error(red(`Error: Invalid project type "${projectType}". Must be "js" or "generic".`));
    process.exit(2);
  }

  await setProjectType(projectPath, projectType as ProjectType);
  console.log(`Project type set to "${projectType}"`);
}

/**
 * Display current configuration as JSON.
 *
 * @param projectPath - Absolute path to the project directory
 */
export async function runConfigShowJson(projectPath: string): Promise<void> {
  const resolved = await loadAndResolveConfig(projectPath);

  const output = {
    projectType: resolved.projectType,
    projectTypeSource: resolved.projectTypeSource,
    projectTypeDetectedFrom: resolved.projectTypeDetectedFrom,
    checks: resolved.checks,
    tags: resolved.tags,
    groups: resolved.groups,
  };

  console.log(JSON.stringify(output, null, 2));
}
