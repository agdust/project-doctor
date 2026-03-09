import type { CheckResult, CheckTag } from "../types.js";
import type { ResolvedConfig } from "../config/types.js";
import { createGlobalContext, type CreateContextOptions } from "../context/global.js";
import { loadAndRunChecks } from "./check-loader.js";

export interface RunnerOptions {
  projectPath: string;
  skipConfig?: boolean;
  // CLI overrides
  /** Only run these groups (CLI filter) */
  groups?: string[];
  /** Only run checks with these tags (CLI filter) */
  includeTags?: CheckTag[];
  /** Skip checks with these tags (CLI filter) */
  excludeTags?: CheckTag[];
}

export interface RunnerResult {
  results: CheckResult[];
  config: ResolvedConfig;
}

export async function runChecks(options: RunnerOptions): Promise<RunnerResult> {
  // Build config overrides from CLI options
  const configOverrides: Partial<ResolvedConfig> = {};

  // Convert CLI exclude tags to tags config format
  if (options.excludeTags !== undefined && options.excludeTags.length > 0) {
    configOverrides.tags = {};
    for (const tag of options.excludeTags) {
      configOverrides.tags[tag] = "off";
    }
  }

  const contextOptions: CreateContextOptions = {
    skipConfig: options.skipConfig,
    configOverrides: Object.keys(configOverrides).length > 0 ? configOverrides : undefined,
  };

  const global = await createGlobalContext(options.projectPath, contextOptions);

  const { results } = await loadAndRunChecks(global, {
    groups: options.groups,
    includeTags: options.includeTags,
  });

  return { results, config: global.config };
}

export async function runAllChecks(projectPath: string): Promise<CheckResult[]> {
  const { results } = await runChecks({ projectPath });
  return results;
}
