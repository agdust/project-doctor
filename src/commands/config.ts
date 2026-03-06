/**
 * Config command - Show and set configuration values
 *
 * Usage:
 *   project-doctor config [path]              Show current configuration
 *   project-doctor config set project-type <js|generic> [path]   Set project type
 */

import { loadAndResolveConfig, setProjectType } from "../config/loader.js";
import type { ProjectType, Severity } from "../config/types.js";
import { isMuteUntil, parseMuteUntil, extractSeverity } from "../config/severity.js";
import { bold, dim, green, yellow, red } from "../utils/colors.js";
import { toDateString } from "../utils/dates.js";
import { blank } from "../cli-framework/renderer.js";

function formatSeverity(severity: Severity): string {
  if (severity === "off") {
    return dim("off");
  }
  if (isMuteUntil(severity)) {
    const date = parseMuteUntil(severity);
    if (date) {
      return yellow(`mute-until-${toDateString(date)}`);
    }
    return dim(severity);
  }
  return green("error");
}

function formatProjectTypeSource(source: "config" | "detected", detectedFrom?: string): string {
  if (source === "config") {
    return dim("(from config)");
  }
  if (detectedFrom !== undefined && detectedFrom !== "fallback") {
    return dim(`(auto-detected from ${detectedFrom})`);
  }
  return dim("(auto-detected)");
}

/**
 * Display current project configuration.
 *
 * Shows project type, configured checks, and tags
 * with their current severity settings.
 *
 * @param projectPath - Absolute path to the project directory
 */
export async function runConfigShow(projectPath: string): Promise<void> {
  const resolved = await loadAndResolveConfig(projectPath);

  blank();
  console.log(
    `${bold("Project Type:")} ${resolved.projectType} ${formatProjectTypeSource(resolved.projectTypeSource, resolved.projectTypeDetectedFrom)}`,
  );
  blank();

  // Show checks configuration
  const checkEntries = Object.entries(resolved.checks);
  if (checkEntries.length > 0) {
    console.log(bold("Checks:"));
    for (const [name, entry] of checkEntries) {
      const severity = extractSeverity(entry) ?? "error";
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    blank();
  } else {
    console.log(`${bold("Checks:")} ${dim("(none configured)")}`);
    blank();
  }

  // Show tags configuration
  const tagEntries = Object.entries(resolved.tags);
  if (tagEntries.length > 0) {
    console.log(bold("Tags:"));
    for (const [name, severity] of tagEntries) {
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    blank();
  } else {
    console.log(`${bold("Tags:")} ${dim("(none configured)")}`);
    blank();
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
  };

  console.log(JSON.stringify(output, null, 2));
}
