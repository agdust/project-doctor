import type { CheckResult, CheckResultBase, CheckTag, DetectedTools } from "../types.js";
import type { ProjectType, ResolvedConfig } from "../config/types.js";
import { isCheckOff, isTagOff, isGroupOff } from "../config/loader.js";
import { checkGroups } from "../registry.js";
import { createGlobalContext, type CreateContextOptions } from "../context/global.js";

// Groups that require specific tools to be detected
const GROUP_TOOL_REQUIREMENTS: Record<string, keyof DetectedTools> = {
  eslint: "hasEslint",
  prettier: "hasPrettier",
  tsconfig: "hasTypeScript",
};

// Groups that are specific to JS/Node projects
const JS_GROUPS = new Set([
  "package-json",
  "tsconfig",
  "eslint",
  "prettier",
  "npm",
  "deps",
  "testing",
  "bundle-size",
  "jscpd",
]);

function isGroupForProjectType(groupName: string, projectType: ProjectType): boolean {
  if (projectType === "js") return true;
  // For "generic" projects, skip JS-specific groups
  return !JS_GROUPS.has(groupName);
}

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
  // CLI overrides
  /** Only run these groups (CLI filter) */
  groups?: string[];
  /** Only run checks with these tags (CLI filter) */
  includeTags?: CheckTag[];
  /** Skip checks with these tags (CLI filter) */
  excludeTags?: CheckTag[];
};

function shouldRunCheck(
  checkName: string,
  checkTags: CheckTag[],
  config: ResolvedConfig,
  cliIncludeTags?: CheckTag[]
): boolean {
  // Check if this check is turned off in config
  if (isCheckOff(config, checkName)) {
    return false;
  }

  // Check if any of the check's tags are turned off in config
  for (const tag of checkTags) {
    if (isTagOff(config, tag)) {
      return false;
    }
  }

  // CLI include tags filter (only run checks with these tags)
  if (cliIncludeTags && cliIncludeTags.length > 0) {
    const hasIncluded = checkTags.some((t) => cliIncludeTags.includes(t));
    if (!hasIncluded) return false;
  }

  return true;
}

export async function runChecks(options: RunnerOptions): Promise<CheckResult[]> {
  // Build config overrides from CLI options
  const configOverrides: Partial<ResolvedConfig> = {};

  // Convert CLI exclude tags to tags config format
  if (options.excludeTags?.length) {
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
  const config = global.config;

  // Determine which groups to run
  // If CLI specifies groups, only run those (filter)
  // Otherwise run all groups except those turned off in config
  let groupsToRun = checkGroups;

  if (options.groups?.length) {
    // CLI filter: only run specified groups
    groupsToRun = checkGroups.filter((g) => options.groups!.includes(g.name));
  } else {
    // Config filter: skip groups turned off
    groupsToRun = checkGroups.filter((g) => !isGroupOff(config, g.name));
  }

  const allResults: CheckResult[] = [];

  for (const group of groupsToRun) {
    // Skip JS groups for generic projects
    if (!isGroupForProjectType(group.name, config.projectType)) {
      continue;
    }

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
      if (!shouldRunCheck(check.name, check.tags, config, options.includeTags)) {
        continue;
      }

      try {
        // Type assertion needed because checkGroups contains mixed context types
        // but each group's checks are correctly typed for their own context
        const baseResult = await (check.run as (g: typeof global, c: unknown) => Promise<CheckResultBase>)(global, groupContext);
        const result: CheckResult = { ...baseResult, group: group.name };
        allResults.push(result);
      } catch (error) {
        const errorResult: CheckResult = {
          name: check.name,
          group: group.name,
          status: "fail",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
        allResults.push(errorResult);
      }
    }
  }

  return allResults;
}

export async function runAllChecks(projectPath: string): Promise<CheckResult[]> {
  return runChecks({ projectPath });
}
