import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import JSON5 from "json5";
import type { Config, ResolvedConfig, Severity, ProjectType, ProjectTypeSource } from "./types.js";
import { DEFAULT_CONFIG, isSkipUntilActive } from "./types.js";
import { CONFIG_DIR, CONFIG_FILE, ensureConfigDir } from "./constants.js";
import { safeJson5Parse, safeJsonParse, safeMergeRecords } from "../utils/safe-json.js";

type PackageJson = {
  doctor?: Config;
};

async function readJson5File<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    // Use safe parsing to prevent prototype pollution
    return safeJson5Parse<T>(content);
  } catch {
    return null;
  }
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    // Use safe parsing to prevent prototype pollution
    return safeJsonParse<T>(content);
  } catch {
    return null;
  }
}

export async function loadConfig(projectPath: string): Promise<Config | null> {
  // Try .project-doctor/config.json5 first
  const json5Path = join(projectPath, ".project-doctor", "config.json5");
  const json5Config = await readJson5File<Config>(json5Path);
  if (json5Config) {
    return json5Config;
  }

  // Try legacy .project-doctor/config.json
  const jsonPath = join(projectPath, ".project-doctor", "config.json");
  const jsonConfig = await readJsonFile<Config>(jsonPath);
  if (jsonConfig) {
    return jsonConfig;
  }

  // Try package.json#doctor
  const packagePath = join(projectPath, "package.json");
  const packageJson = await readJsonFile<PackageJson>(packagePath);
  if (packageJson?.doctor) {
    return packageJson.doctor;
  }

  return null;
}

export function resolveConfig(
  config: Config | null,
  detection: ProjectTypeDetection
): ResolvedConfig {
  if (!config) {
    return {
      ...DEFAULT_CONFIG,
      projectType: detection.type,
      projectTypeSource: detection.source,
      projectTypeDetectedFrom: detection.detectedFrom,
    };
  }

  // If config has projectType set, use it (source = "config")
  // Otherwise use auto-detected
  const hasManualProjectType = config.projectType !== undefined;

  return {
    projectType: config.projectType ?? detection.type,
    projectTypeSource: hasManualProjectType ? "config" : detection.source,
    projectTypeDetectedFrom: hasManualProjectType ? undefined : detection.detectedFrom,
    checks: config.checks ?? DEFAULT_CONFIG.checks,
    tags: config.tags ?? DEFAULT_CONFIG.tags,
    groups: config.groups ?? DEFAULT_CONFIG.groups,
    eslintOverwriteConfirmed: config.eslintOverwriteConfirmed ?? DEFAULT_CONFIG.eslintOverwriteConfirmed,
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Result of project type detection */
export type ProjectTypeDetection = {
  type: ProjectType;
  /** How the type was determined */
  source: "config" | "detected";
  /** If detected, which file triggered it (or "fallback" if no JS files found) */
  detectedFrom?: string;
};

/**
 * Auto-detect project type based on files present in the project.
 * Returns "js" if any JS/Node ecosystem files are found, "generic" otherwise.
 */
export async function detectProjectType(projectPath: string): Promise<ProjectType> {
  const result = await detectProjectTypeWithCause(projectPath);
  return result.type;
}

/**
 * Auto-detect project type with the cause of detection.
 */
export async function detectProjectTypeWithCause(projectPath: string): Promise<ProjectTypeDetection> {
  // Check for JS ecosystem indicators (in order of priority)
  const jsIndicators = [
    "package.json",
    "tsconfig.json",
    "jsconfig.json",
    ".nvmrc",
    ".node-version",
    "yarn.lock",
    "package-lock.json",
    "pnpm-lock.yaml",
    "bun.lockb",
    ".npmrc",
  ];

  for (const indicator of jsIndicators) {
    if (await fileExists(join(projectPath, indicator))) {
      return {
        type: "js",
        source: "detected",
        detectedFrom: indicator,
      };
    }
  }

  return {
    type: "generic",
    source: "detected",
    detectedFrom: "fallback",
  };
}

export async function loadAndResolveConfig(projectPath: string): Promise<ResolvedConfig> {
  const config = await loadConfig(projectPath);
  const detection = await detectProjectTypeWithCause(projectPath);
  return resolveConfig(config, detection);
}

/**
 * Check if a severity value means "off" (disabled/skipped)
 * - "off" -> true
 * - "skip-until-YYYY-MM-DD" -> true if date not passed, false if expired
 * - "error" or anything else -> false
 */
function isSeverityOff(value: Severity | undefined): boolean {
  if (!value) return false;
  if (value === "off") return true;
  if (value === "error") return false;
  // Check skip-until pattern
  return isSkipUntilActive(value);
}

/** Check if a check is disabled */
export function isCheckOff(config: ResolvedConfig, checkName: string): boolean {
  return isSeverityOff(config.checks[checkName]);
}

/** Check if a tag is disabled */
export function isTagOff(config: ResolvedConfig, tagName: string): boolean {
  return isSeverityOff(config.tags[tagName]);
}

/** Check if a group is disabled */
export function isGroupOff(config: ResolvedConfig, groupName: string): boolean {
  return isSeverityOff(config.groups[groupName]);
}

/** Update config with new values, merging with existing config */
export async function updateConfig(projectPath: string, updates: Partial<Config>): Promise<void> {
  const configDir = join(projectPath, CONFIG_DIR);
  const configPath = join(configDir, CONFIG_FILE);

  // Load existing config (if any)
  const existing = await loadConfig(projectPath);

  // Deep merge objects using safe merge to prevent prototype pollution
  const mergedChecks = safeMergeRecords(existing?.checks, updates.checks);
  const mergedTags = safeMergeRecords(existing?.tags, updates.tags);
  const mergedGroups = safeMergeRecords(existing?.groups, updates.groups);

  const merged: Config = {
    projectType: updates.projectType ?? existing?.projectType,
    eslintOverwriteConfirmed: updates.eslintOverwriteConfirmed ?? existing?.eslintOverwriteConfirmed,
    checks: Object.keys(mergedChecks).length > 0 ? mergedChecks : undefined,
    tags: Object.keys(mergedTags).length > 0 ? mergedTags : undefined,
    groups: Object.keys(mergedGroups).length > 0 ? mergedGroups : undefined,
  };

  // Ensure config directory exists with .gitignore
  await ensureConfigDir(projectPath);

  // Write merged config as JSON5
  await writeFile(configPath, JSON5.stringify(merged, null, 2) + "\n", "utf-8");
}

/** Set a check's severity in config */
export async function setCheckSeverity(
  projectPath: string,
  checkName: string,
  severity: Severity
): Promise<void> {
  await updateConfig(projectPath, {
    checks: { [checkName]: severity },
  });
}

/** Set a tag's severity in config */
export async function setTagSeverity(
  projectPath: string,
  tagName: string,
  severity: Severity
): Promise<void> {
  await updateConfig(projectPath, {
    tags: { [tagName]: severity },
  });
}

/** Set a group's severity in config */
export async function setGroupSeverity(
  projectPath: string,
  groupName: string,
  severity: Severity
): Promise<void> {
  await updateConfig(projectPath, {
    groups: { [groupName]: severity },
  });
}

/** Set the project type in config */
export async function setProjectType(
  projectPath: string,
  projectType: ProjectType
): Promise<void> {
  await updateConfig(projectPath, {
    projectType,
  });
}
