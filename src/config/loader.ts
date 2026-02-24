import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import JSON5 from "json5";
import type { Config, ResolvedConfig, Severity, ProjectType } from "./types.js";
import type { ManualCheckState } from "../types.js";
import { DEFAULT_CONFIG, isSkipUntilActive } from "./types.js";
import { CONFIG_DIR, CONFIG_FILE, ensureConfigDir } from "./constants.js";
import { safeJson5Parse, safeJsonParse, safeMergeRecords } from "../utils/safe-json.js";
import { atomicWriteFile } from "../utils/safe-fs.js";

interface PackageJson {
  doctor?: Config;
}

interface ReadResult<T> {
  data: T | null;
  exists: boolean;
  parseError: boolean;
}

/** Helper to check if an error is a Node.js error with a code property */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

/** Generic file reader with configurable parser */
async function readFileWithParser<T>(
  path: string,
  parser: (content: string) => T | null,
): Promise<ReadResult<T>> {
  try {
    const content = await readFile(path, "utf-8");
    // Use safe parsing to prevent prototype pollution
    const data = parser(content);
    if (data === null) {
      // File exists but failed to parse
      return { data: null, exists: true, parseError: true };
    }
    return { data, exists: true, parseError: false };
  } catch (error) {
    // Check if it's a "file not found" error vs other errors
    if (isNodeError(error) && error.code === "ENOENT") {
      return { data: null, exists: false, parseError: false };
    }
    // Other read errors (permissions, etc.)
    if (process.env.DEBUG) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[DEBUG] Error reading ${path}: ${msg}`);
    }
    return { data: null, exists: true, parseError: true };
  }
}

async function readJson5File<T>(path: string): Promise<ReadResult<T>> {
  return readFileWithParser(path, safeJson5Parse<T>);
}

async function readJsonFile<T>(path: string): Promise<ReadResult<T>> {
  return readFileWithParser(path, safeJsonParse<T>);
}

export async function loadConfig(projectPath: string): Promise<Config | null> {
  // Try .project-doctor/config.json5 first
  const json5Path = join(projectPath, ".project-doctor", "config.json5");
  const json5Result = await readJson5File<Config>(json5Path);
  if (json5Result.data) {
    return json5Result.data;
  }
  if (json5Result.exists && json5Result.parseError) {
    console.warn(`Warning: Could not parse ${json5Path} - using defaults`);
  }

  // Try legacy .project-doctor/config.json
  const jsonPath = join(projectPath, ".project-doctor", "config.json");
  const jsonResult = await readJsonFile<Config>(jsonPath);
  if (jsonResult.data) {
    return jsonResult.data;
  }
  if (jsonResult.exists && jsonResult.parseError) {
    console.warn(`Warning: Could not parse ${jsonPath} - using defaults`);
  }

  // Try package.json#doctor
  const packagePath = join(projectPath, "package.json");
  const packageResult = await readJsonFile<PackageJson>(packagePath);
  if (packageResult.data?.doctor) {
    return packageResult.data.doctor;
  }

  return null;
}

export function resolveConfig(
  config: Config | null,
  detection: ProjectTypeDetection,
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
    eslintOverwriteConfirmed:
      config.eslintOverwriteConfirmed ?? DEFAULT_CONFIG.eslintOverwriteConfirmed,
    noGitConfirmed: config.noGitConfirmed ?? DEFAULT_CONFIG.noGitConfirmed,
    manualChecks: config.manualChecks ?? DEFAULT_CONFIG.manualChecks,
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    // File doesn't exist or isn't accessible
    return false;
  }
}

/** Result of project type detection */
export interface ProjectTypeDetection {
  type: ProjectType;
  /** How the type was determined */
  source: "config" | "detected";
  /** If detected, which file triggered it (or "fallback" if no JS files found) */
  detectedFrom?: string;
}

/**
 * Auto-detect project type based on files present in the project.
 * Returns "js" if any JS/Node ecosystem files are found, "generic" otherwise.
 */
/**
 * Auto-detect project type with the cause of detection.
 */
export async function detectProjectTypeWithCause(
  projectPath: string,
): Promise<ProjectTypeDetection> {
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

// Simple in-memory lock to prevent concurrent config updates
const configLocks = new Map<string, Promise<void>>();

/**
 * Execute a function with an exclusive lock on the config file.
 * This prevents race conditions when multiple fixes run concurrently.
 */
async function withConfigLock<T>(projectPath: string, fn: () => Promise<T>): Promise<T> {
  const lockKey = join(projectPath, CONFIG_DIR, CONFIG_FILE);

  // Wait for any existing operation to complete
  while (configLocks.has(lockKey)) {
    await configLocks.get(lockKey);
  }

  // Create a new lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  configLocks.set(lockKey, lockPromise);

  try {
    return await fn();
  } finally {
    configLocks.delete(lockKey);
    releaseLock!();
  }
}

/** Update config with new values, merging with existing config */
export async function updateConfig(projectPath: string, updates: Partial<Config>): Promise<void> {
  return withConfigLock(projectPath, async () => {
    const configDir = join(projectPath, CONFIG_DIR);
    const configPath = join(configDir, CONFIG_FILE);

    // Load existing config (if any)
    const existing = await loadConfig(projectPath);

    // Deep merge objects using safe merge to prevent prototype pollution
    const mergedChecks = safeMergeRecords(existing?.checks, updates.checks);
    const mergedTags = safeMergeRecords(existing?.tags, updates.tags);
    const mergedGroups = safeMergeRecords(existing?.groups, updates.groups);
    const mergedManualChecks = safeMergeRecords(existing?.manualChecks, updates.manualChecks);

    const merged: Config = {
      projectType: updates.projectType ?? existing?.projectType,
      eslintOverwriteConfirmed:
        updates.eslintOverwriteConfirmed ?? existing?.eslintOverwriteConfirmed,
      checks: Object.keys(mergedChecks).length > 0 ? mergedChecks : undefined,
      tags: Object.keys(mergedTags).length > 0 ? mergedTags : undefined,
      groups: Object.keys(mergedGroups).length > 0 ? mergedGroups : undefined,
      manualChecks: Object.keys(mergedManualChecks).length > 0 ? mergedManualChecks : undefined,
    };

    // Ensure config directory exists with .gitignore
    await ensureConfigDir(projectPath);

    // Write merged config atomically as JSON5
    await atomicWriteFile(configPath, JSON5.stringify(merged, null, 2) + "\n");
  });
}

/** Set a check's severity in config */
export async function setCheckSeverity(
  projectPath: string,
  checkName: string,
  severity: Severity,
): Promise<void> {
  await updateConfig(projectPath, {
    checks: { [checkName]: severity },
  });
}

/** Set a tag's severity in config */
export async function setTagSeverity(
  projectPath: string,
  tagName: string,
  severity: Severity,
): Promise<void> {
  await updateConfig(projectPath, {
    tags: { [tagName]: severity },
  });
}

/** Set a group's severity in config */
export async function setGroupSeverity(
  projectPath: string,
  groupName: string,
  severity: Severity,
): Promise<void> {
  await updateConfig(projectPath, {
    groups: { [groupName]: severity },
  });
}

/** Set the project type in config */
export async function setProjectType(projectPath: string, projectType: ProjectType): Promise<void> {
  await updateConfig(projectPath, {
    projectType,
  });
}

/** Set a manual check's state in config */
export async function setManualCheckState(
  projectPath: string,
  checkName: string,
  state: ManualCheckState,
): Promise<void> {
  await updateConfig(projectPath, {
    manualChecks: { [checkName]: state },
  });
}
