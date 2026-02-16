import type { GlobalContext } from "../types.js";
import type { ResolvedConfig } from "../config/types.js";
import { createFileCache } from "./file-cache.js";
import { detectTools } from "./detect.js";
import { loadAndResolveConfig, detectProjectTypeWithCause } from "../config/loader.js";
import { safeMergeRecords } from "../utils/safe-json.js";

export interface CreateContextOptions {
  skipConfig?: boolean;
  configOverrides?: Partial<ResolvedConfig>;
}

export async function createGlobalContext(
  projectPath: string,
  options: CreateContextOptions = {},
): Promise<GlobalContext> {
  const files = createFileCache(projectPath);
  const detected = await detectTools(files);

  let config: ResolvedConfig;
  if (options.skipConfig) {
    const { DEFAULT_CONFIG } = await import("../config/types.js");
    // Still detect project type even when skipping config
    const detection = await detectProjectTypeWithCause(projectPath);
    config = {
      ...DEFAULT_CONFIG,
      projectType: detection.type,
      projectTypeSource: detection.source,
      projectTypeDetectedFrom: detection.detectedFrom,
    };
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
  // Use safeMergeRecords to prevent prototype pollution
  return {
    projectType: overrides.projectType ?? base.projectType,
    projectTypeSource: overrides.projectTypeSource ?? base.projectTypeSource,
    projectTypeDetectedFrom: overrides.projectTypeDetectedFrom ?? base.projectTypeDetectedFrom,
    checks: overrides.checks ? safeMergeRecords(base.checks, overrides.checks) : base.checks,
    tags: overrides.tags ? safeMergeRecords(base.tags, overrides.tags) : base.tags,
    groups: overrides.groups ? safeMergeRecords(base.groups, overrides.groups) : base.groups,
    eslintOverwriteConfirmed: overrides.eslintOverwriteConfirmed ?? base.eslintOverwriteConfirmed,
  };
}
