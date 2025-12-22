import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config, ResolvedConfig } from "./types.ts";
import { DEFAULT_CONFIG } from "./types.ts";

type PackageJson = {
  doctor?: Config;
};

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function loadConfig(projectPath: string): Promise<Config | null> {
  // Try .projector-doctorrc.json first
  const rcPath = join(projectPath, ".projector-doctorrc.json");
  const rcConfig = await readJsonFile<Config>(rcPath);
  if (rcConfig) {
    return rcConfig;
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
    checks: {
      groups: config.checks?.groups ?? DEFAULT_CONFIG.checks.groups,
      include: config.checks?.include ?? DEFAULT_CONFIG.checks.include,
      exclude: config.checks?.exclude ?? DEFAULT_CONFIG.checks.exclude,
      disable: config.checks?.disable ?? DEFAULT_CONFIG.checks.disable,
    },
    options: {
      "package-json": {
        requiredScripts:
          config.options?.["package-json"]?.requiredScripts ??
          DEFAULT_CONFIG.options["package-json"].requiredScripts,
      },
      docs: {
        requiredFiles:
          config.options?.docs?.requiredFiles ??
          DEFAULT_CONFIG.options.docs.requiredFiles,
        optionalFiles:
          config.options?.docs?.optionalFiles ??
          DEFAULT_CONFIG.options.docs.optionalFiles,
      },
      testing: {
        frameworks:
          config.options?.testing?.frameworks ??
          DEFAULT_CONFIG.options.testing.frameworks,
      },
      env: {
        exampleFile:
          config.options?.env?.exampleFile ??
          DEFAULT_CONFIG.options.env.exampleFile,
      },
      gitignore: {
        requiredPatterns:
          config.options?.gitignore?.requiredPatterns ??
          DEFAULT_CONFIG.options.gitignore.requiredPatterns,
      },
    },
    severity: config.severity ?? DEFAULT_CONFIG.severity,
  };
}

export async function loadAndResolveConfig(projectPath: string): Promise<ResolvedConfig> {
  const config = await loadConfig(projectPath);
  return resolveConfig(config);
}
