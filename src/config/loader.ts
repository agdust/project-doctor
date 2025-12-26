import { readFile } from "node:fs/promises";
import { join } from "node:path";
import JSON5 from "json5";
import type { Config, ResolvedConfig } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

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
    groups: config.groups ?? DEFAULT_CONFIG.groups,
    includeTags: config.includeTags ?? DEFAULT_CONFIG.includeTags,
    excludeTags: config.excludeTags ?? DEFAULT_CONFIG.excludeTags,
    excludeChecks: config.excludeChecks ?? DEFAULT_CONFIG.excludeChecks,
  };
}

export async function loadAndResolveConfig(projectPath: string): Promise<ResolvedConfig> {
  const config = await loadConfig(projectPath);
  return resolveConfig(config);
}
