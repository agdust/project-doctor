import type { CheckResult, CheckTag } from "../types.ts";
import type { ResolvedConfig, SeverityOverride } from "../config/types.ts";
import { checkGroups } from "../registry.ts";
import { createGlobalContext, type CreateContextOptions } from "../context/global.ts";

export type RunnerOptions = {
  projectPath: string;
  skipConfig?: boolean;
  // CLI overrides (merged with config)
  groups?: string[];
  includeTags?: CheckTag[];
  excludeTags?: CheckTag[];
};

function shouldRunCheck(
  checkName: string,
  checkTags: CheckTag[],
  config: ResolvedConfig,
  cliIncludeTags?: CheckTag[],
  cliExcludeTags?: CheckTag[]
): boolean {
  // Check disabled list from config
  if (config.checks.disable.includes(checkName)) {
    return false;
  }

  // Merge config and CLI excludes
  const allExcludes = [...config.checks.exclude, ...(cliExcludeTags ?? [])];
  if (allExcludes.length > 0) {
    const hasExcluded = checkTags.some((t) => allExcludes.includes(t));
    if (hasExcluded) return false;
  }

  // Merge config and CLI includes
  const allIncludes = [...config.checks.include, ...(cliIncludeTags ?? [])];
  if (allIncludes.length > 0) {
    const hasIncluded = checkTags.some((t) => allIncludes.includes(t));
    if (!hasIncluded) return false;
  }

  return true;
}

function applySeverityOverride(
  result: CheckResult,
  severity: Record<string, SeverityOverride>
): CheckResult {
  const override = severity[result.name];
  if (!override) {
    return result;
  }

  // Only downgrade severity, never upgrade
  // fail -> warn or skip is ok
  // warn -> skip is ok
  // pass stays pass
  if (result.status === "pass") {
    return result;
  }

  return {
    ...result,
    status: override,
    message: override === "skip"
      ? `[skipped by config] ${result.message}`
      : override === "warn" && result.status === "fail"
        ? `[downgraded to warn] ${result.message}`
        : result.message,
  };
}

export async function runChecks(options: RunnerOptions): Promise<CheckResult[]> {
  // Build config overrides from CLI options
  const configOverrides: Partial<ResolvedConfig> = {};
  if (options.groups?.length) {
    configOverrides.checks = { ...configOverrides.checks, groups: options.groups };
  }
  if (options.includeTags?.length) {
    configOverrides.checks = { ...configOverrides.checks, include: options.includeTags };
  }
  if (options.excludeTags?.length) {
    configOverrides.checks = { ...configOverrides.checks, exclude: options.excludeTags };
  }

  const contextOptions: CreateContextOptions = {
    skipConfig: options.skipConfig,
    configOverrides: Object.keys(configOverrides).length > 0 ? configOverrides : undefined,
  };

  const global = await createGlobalContext(options.projectPath, contextOptions);
  const config = global.config;

  // Determine which groups to run
  const allGroups = [...config.checks.groups, ...(options.groups ?? [])];
  const groupsToRun = allGroups.length > 0
    ? checkGroups.filter((g) => allGroups.includes(g.name))
    : checkGroups;

  const allResults: CheckResult[] = [];

  for (const group of groupsToRun) {
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      if (!shouldRunCheck(check.name, check.tags, config, options.includeTags, options.excludeTags)) {
        continue;
      }

      try {
        let result = await check.run(global, groupContext);
        result = applySeverityOverride(result, config.severity);
        allResults.push(result);
      } catch (error) {
        const errorResult: CheckResult = {
          name: check.name,
          status: "fail",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
        allResults.push(applySeverityOverride(errorResult, config.severity));
      }
    }
  }

  return allResults;
}

export async function runAllChecks(projectPath: string): Promise<CheckResult[]> {
  return runChecks({ projectPath });
}
