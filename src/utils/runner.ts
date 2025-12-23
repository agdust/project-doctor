import type { CheckResult, CheckResultBase, CheckTag, DetectedTools } from "../types.js";
import type { ResolvedConfig, SeverityOverride } from "../config/types.js";
import { checkGroups } from "../registry.js";
import { createGlobalContext, type CreateContextOptions } from "../context/global.js";

// Groups that require specific tools to be detected
const GROUP_TOOL_REQUIREMENTS: Record<string, keyof DetectedTools> = {
  eslint: "hasEslint",
  prettier: "hasPrettier",
  tsconfig: "hasTypeScript",
};

function isToolDetected(groupName: string, detected: DetectedTools): boolean {
  const requirement = GROUP_TOOL_REQUIREMENTS[groupName];
  if (!requirement) return true;
  return Boolean(detected[requirement]);
}

function getToolName(groupName: string): string {
  const names: Record<string, string> = {
    eslint: "ESLint",
    prettier: "Prettier",
    tsconfig: "TypeScript",
  };
  return names[groupName] ?? groupName;
}

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

  const checksOverride: Partial<ResolvedConfig["checks"]> = {};
  if (options.groups?.length) {
    checksOverride.groups = options.groups;
  }
  if (options.includeTags?.length) {
    checksOverride.include = options.includeTags;
  }
  if (options.excludeTags?.length) {
    checksOverride.exclude = options.excludeTags;
  }
  if (Object.keys(checksOverride).length > 0) {
    configOverrides.checks = checksOverride as ResolvedConfig["checks"];
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
    // Skip detailed checks if required tool is not detected
    if (!isToolDetected(group.name, global.detected)) {
      const toolName = getToolName(group.name);
      allResults.push({
        name: `${group.name}-not-detected`,
        group: group.name,
        status: "skip",
        message: `${toolName} not detected`,
      });
      continue;
    }

    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      if (!shouldRunCheck(check.name, check.tags, config, options.includeTags, options.excludeTags)) {
        continue;
      }

      try {
        // Type assertion needed because checkGroups contains mixed context types
        // but each group's checks are correctly typed for their own context
        const baseResult = await (check.run as (g: typeof global, c: unknown) => Promise<CheckResultBase>)(global, groupContext);
        const result: CheckResult = { ...baseResult, group: group.name };
        allResults.push(applySeverityOverride(result, config.severity));
      } catch (error) {
        const errorResult: CheckResult = {
          name: check.name,
          group: group.name,
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
