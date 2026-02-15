/**
 * Config command - Show and set configuration values
 *
 * Usage:
 *   project-doctor config [path]              Show current configuration
 *   project-doctor config set project-type <js|generic> [path]   Set project type
 */

import { loadConfig, loadAndResolveConfig, setProjectType } from "../config/loader.js";
import type { ProjectType, Severity } from "../config/types.js";
import { isSkipUntil, parseSkipUntil } from "../config/types.js";
import { listGroups } from "../registry.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[90m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";

function formatSeverity(severity: Severity): string {
  if (severity === "off") {
    return `${DIM}off${RESET}`;
  }
  if (isSkipUntil(severity)) {
    const date = parseSkipUntil(severity);
    if (date) {
      return `${YELLOW}skip-until-${date.toISOString().split("T")[0]}${RESET}`;
    }
    return `${DIM}${severity}${RESET}`;
  }
  return `${GREEN}error${RESET}`;
}

function formatProjectTypeSource(source: "config" | "detected", detectedFrom?: string): string {
  if (source === "config") {
    return `${DIM}(from config)${RESET}`;
  }
  if (detectedFrom && detectedFrom !== "fallback") {
    return `${DIM}(auto-detected from ${detectedFrom})${RESET}`;
  }
  return `${DIM}(auto-detected)${RESET}`;
}

export async function runConfigShow(projectPath: string): Promise<void> {
  const resolved = await loadAndResolveConfig(projectPath);

  console.log();
  console.log(`${BOLD}Project Type:${RESET} ${resolved.projectType} ${formatProjectTypeSource(resolved.projectTypeSource, resolved.projectTypeDetectedFrom)}`);
  console.log();

  // Show checks configuration
  const checkEntries = Object.entries(resolved.checks);
  if (checkEntries.length > 0) {
    console.log(`${BOLD}Checks:${RESET}`);
    for (const [name, severity] of checkEntries) {
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    console.log();
  } else {
    console.log(`${BOLD}Checks:${RESET} ${DIM}(none configured)${RESET}`);
    console.log();
  }

  // Show tags configuration
  const tagEntries = Object.entries(resolved.tags);
  if (tagEntries.length > 0) {
    console.log(`${BOLD}Tags:${RESET}`);
    for (const [name, severity] of tagEntries) {
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    console.log();
  } else {
    console.log(`${BOLD}Tags:${RESET} ${DIM}(none configured)${RESET}`);
    console.log();
  }

  // Show groups configuration
  const groupEntries = Object.entries(resolved.groups);
  if (groupEntries.length > 0) {
    console.log(`${BOLD}Groups:${RESET}`);
    for (const [name, severity] of groupEntries) {
      console.log(`  ${name}: ${formatSeverity(severity)}`);
    }
    console.log();
  } else {
    console.log(`${BOLD}Groups:${RESET} ${DIM}(none configured)${RESET}`);
    console.log();
  }
}

export async function runConfigSetProjectType(
  projectPath: string,
  projectType: string
): Promise<void> {
  // Validate project type
  if (projectType !== "js" && projectType !== "generic") {
    console.error(`\x1b[31mError: Invalid project type "${projectType}". Must be "js" or "generic".\x1b[0m`);
    process.exit(2);
  }

  await setProjectType(projectPath, projectType as ProjectType);
  console.log(`Project type set to "${projectType}"`);
}

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
