import type { GlobalContext } from "../types.ts";
import type { ResolvedConfig } from "../config/types.ts";
import { createFileCache } from "./file-cache.ts";
import { detectTools } from "./detect.ts";
import { loadAndResolveConfig } from "../config/loader.ts";

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
    const { DEFAULT_CONFIG } = await import("../config/types.ts");
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
