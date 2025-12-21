import type { CheckResult, CheckTag, GlobalContext } from "../types.ts";
import { checkGroups, runGroupChecks } from "../registry.ts";
import { createGlobalContext } from "../context/global.ts";

export type RunnerOptions = {
  projectPath: string;
  groups?: string[];
  includeTags?: CheckTag[];
  excludeTags?: CheckTag[];
};

function shouldRunCheck(
  checkTags: CheckTag[],
  includeTags?: CheckTag[],
  excludeTags?: CheckTag[]
): boolean {
  if (excludeTags && excludeTags.length > 0) {
    const hasExcluded = checkTags.some((t) => excludeTags.includes(t));
    if (hasExcluded) return false;
  }

  if (includeTags && includeTags.length > 0) {
    const hasIncluded = checkTags.some((t) => includeTags.includes(t));
    if (!hasIncluded) return false;
  }

  return true;
}

export async function runChecks(options: RunnerOptions): Promise<CheckResult[]> {
  const global = await createGlobalContext(options.projectPath);

  const groupsToRun = options.groups
    ? checkGroups.filter((g) => options.groups?.includes(g.name))
    : checkGroups;

  const allResults: CheckResult[] = [];

  for (const group of groupsToRun) {
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      if (!shouldRunCheck(check.tags, options.includeTags, options.excludeTags)) {
        continue;
      }

      try {
        const result = await check.run(global, groupContext);
        allResults.push(result);
      } catch (error) {
        allResults.push({
          name: check.name,
          status: "fail",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  }

  return allResults;
}

export async function runAllChecks(projectPath: string): Promise<CheckResult[]> {
  return runChecks({ projectPath });
}
