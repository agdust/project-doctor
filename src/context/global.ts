import type { GlobalContext } from "../types.js";
import type { ResolvedConfig } from "../config/types.js";
import { createFileCache } from "./file-cache.js";
import { detectTools } from "./detect.js";
import { loadAndResolveConfig } from "../config/loader.js";

export type CreateContextOptions = {
  skipConfig?: boolean;
  configOverrides?: Partial<ResolvedConfig>;
};

export async function createGlobalContext(
  projectPath: string,
  options: CreateContextOptions = {}
): Promise<GlobalContext> {
  const files = createFileCache(projectPath);
  const detected = await detectTools(files);

  let config: ResolvedConfig;
  if (options.skipConfig) {
    const { DEFAULT_CONFIG } = await import("../config/types.js");
    config = DEFAULT_CONFIG;
  } else {
    config = await loadAndResolveConfig(projectPath);
  }

  // Apply CLI overrides
  if (options.configOverrides) {
    config = mergeConfigs(config, options.configOverrides);
  }

  return {
    projectPath,
    detected,
    files,
    config,
  };
}

function mergeConfigs(base: ResolvedConfig, overrides: Partial<ResolvedConfig>): ResolvedConfig {
  return {
    checks: {
      groups: overrides.checks?.groups?.length
        ? [...base.checks.groups, ...overrides.checks.groups]
        : base.checks.groups,
      include: overrides.checks?.include?.length
        ? [...base.checks.include, ...overrides.checks.include]
        : base.checks.include,
      exclude: overrides.checks?.exclude?.length
        ? [...base.checks.exclude, ...overrides.checks.exclude]
        : base.checks.exclude,
      disable: overrides.checks?.disable?.length
        ? [...base.checks.disable, ...overrides.checks.disable]
        : base.checks.disable,
    },
    options: base.options,
    severity: { ...base.severity, ...overrides.severity },
  };
}
