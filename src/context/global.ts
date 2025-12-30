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
    groups: overrides.groups?.length
      ? [...base.groups, ...overrides.groups]
      : base.groups,
    includeTags: overrides.includeTags?.length
      ? [...base.includeTags, ...overrides.includeTags]
      : base.includeTags,
    excludeTags: overrides.excludeTags?.length
      ? [...base.excludeTags, ...overrides.excludeTags]
      : base.excludeTags,
    excludeChecks: overrides.excludeChecks?.length
      ? [...base.excludeChecks, ...overrides.excludeChecks]
      : base.excludeChecks,
    eslintOverwriteConfirmed: overrides.eslintOverwriteConfirmed ?? base.eslintOverwriteConfirmed,
  };
}
