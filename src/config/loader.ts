import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import JSON5 from "json5";
import type { Config, ResolvedConfig, Severity } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";
import { CONFIG_DIR, CONFIG_FILE } from "./constants.js";

type PackageJson = {
  doctor?: Config;
};

async function readJson5File<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON5.parse(content) as T;
  } catch {
    return null;
  }
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
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

export function resolveConfig(config: Config | null): ResolvedConfig {
  if (!config) {
    return DEFAULT_CONFIG;
  }

  return {
    checks: config.checks ?? DEFAULT_CONFIG.checks,
    tags: config.tags ?? DEFAULT_CONFIG.tags,
    groups: config.groups ?? DEFAULT_CONFIG.groups,
    eslintOverwriteConfirmed: config.eslintOverwriteConfirmed ?? DEFAULT_CONFIG.eslintOverwriteConfirmed,
  };
}

export async function loadAndResolveConfig(projectPath: string): Promise<ResolvedConfig> {
  const config = await loadConfig(projectPath);
  return resolveConfig(config);
}

/** Check if a check is disabled */
export function isCheckOff(config: ResolvedConfig, checkName: string): boolean {
  return config.checks[checkName] === "off";
}

/** Check if a tag is disabled */
export function isTagOff(config: ResolvedConfig, tagName: string): boolean {
  return config.tags[tagName] === "off";
}

/** Check if a group is disabled */
export function isGroupOff(config: ResolvedConfig, groupName: string): boolean {
  return config.groups[groupName] === "off";
}

/** Update config with new values, merging with existing config */
export async function updateConfig(projectPath: string, updates: Partial<Config>): Promise<void> {
  const configDir = join(projectPath, CONFIG_DIR);
  const configPath = join(configDir, CONFIG_FILE);

  // Load existing config (if any)
  const existing = await loadConfig(projectPath);

  // Deep merge objects
  const mergedChecks = { ...existing?.checks, ...updates.checks };
  const mergedTags = { ...existing?.tags, ...updates.tags };
  const mergedGroups = { ...existing?.groups, ...updates.groups };

  const merged: Config = {
    ...existing,
    ...updates,
    checks: Object.keys(mergedChecks).length > 0 ? mergedChecks : undefined,
    tags: Object.keys(mergedTags).length > 0 ? mergedTags : undefined,
    groups: Object.keys(mergedGroups).length > 0 ? mergedGroups : undefined,
  };

  // Ensure config directory exists
  await mkdir(configDir, { recursive: true });

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
