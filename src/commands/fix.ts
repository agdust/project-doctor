/**
 * Fix command - Non-interactive fix command
 *
 * Usage:
 *   project-doctor fix [path]                    List fixable issues
 *   project-doctor fix all [options] [path]      Fix all issues
 *   project-doctor fix <check-name> [path]       Fix specific check
 *
 * Options:
 *   --group <name>          Fix only checks in this group
 *   --tag <tag>             Fix only checks with this tag
 *   --pick <option-id>      Select which fix option to apply
 */

import type { CheckResultBase, FixResult, GlobalContext, CheckTag, Fix } from "../types.js";
import { checkGroups } from "../registry.js";
import { sortFixableChecks } from "../utils/fix-chains.js";
import { createGlobalContext } from "../context/global.js";
import { isCheckOff, isTagOff, isGroupOff } from "../config/loader.js";
import { isGroupForProjectType, isFixWithOptions, getValidCheckNames } from "../utils/checks.js";
import type { ResolvedConfig } from "../config/types.js";
import { RESET, BOLD, DIM, GREEN, RED, YELLOW } from "../utils/colors.js";

interface FixableCheck {
  name: string;
  group: string;
  tags: CheckTag[];
  message: string;
  fixDescription: string;
  hasOptions: boolean;
  optionIds?: string[];
  runFix: (pickOption?: string) => Promise<FixResult>;
}

function shouldIncludeCheck(
  checkName: string,
  checkTags: CheckTag[],
  groupName: string,
  config: ResolvedConfig,
  options: FixFilterOptions,
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

  // Check if group is turned off
  if (isGroupOff(config, groupName)) {
    return false;
  }

  // CLI filters
  if (options.groups && options.groups.length > 0) {
    if (!options.groups.includes(groupName)) {
      return false;
    }
  }

  if (options.tags && options.tags.length > 0) {
    const hasMatchingTag = checkTags.some((t) => options.tags!.includes(t));
    if (!hasMatchingTag) {
      return false;
    }
  }

  return true;
}

export interface FixFilterOptions {
  groups?: string[];
  tags?: string[];
}

async function collectFixableChecks(
  projectPath: string,
  options: FixFilterOptions,
): Promise<{ checks: FixableCheck[]; global: GlobalContext }> {
  const global = await createGlobalContext(projectPath);
  const config = global.config;
  const fixableChecks: FixableCheck[] = [];

  // Filter groups based on project type
  const groupsToRun = checkGroups.filter((g) => isGroupForProjectType(g.name, config.projectType));

  // Run all checks and collect fixable failures
  for (const group of groupsToRun) {
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      if (!check.fix) continue;

      if (!shouldIncludeCheck(check.name, check.tags, group.name, config, options)) {
        continue;
      }

      const baseResult = await (
        check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>
      )(global, groupContext);

      if (baseResult.status === "fail") {
        const fix = check.fix as Fix;
        const hasOptions = isFixWithOptions(fix);
        const optionIds = hasOptions ? fix.options.map((o) => o.id) : undefined;

        fixableChecks.push({
          name: check.name,
          group: group.name,
          tags: check.tags,
          message: baseResult.message,
          fixDescription: fix.description,
          hasOptions,
          optionIds,
          runFix: async (pickOption?: string) => {
            if (hasOptions) {
              const optionToUse = pickOption ?? fix.options[0]?.id;
              const option = fix.options.find((o) => o.id === optionToUse);
              if (!option) {
                return { success: false, message: `Unknown fix option: ${optionToUse}` };
              }
              return option.run(global, groupContext);
            } else {
              return (fix as { run: (g: GlobalContext, c: unknown) => Promise<FixResult> }).run(
                global,
                groupContext,
              );
            }
          },
        });
      }
    }
  }

  return { checks: sortFixableChecks(fixableChecks), global };
}

/**
 * List all fixable issues without applying any fixes.
 *
 * Scans the project for failing checks that have fixes available,
 * then prints them to stdout.
 *
 * @param projectPath - Absolute path to the project directory
 * @param options - Filter options (groups, tags)
 */
export async function runFixList(
  projectPath: string,
  options: FixFilterOptions = {},
): Promise<void> {
  console.log();
  console.log(`${DIM}Scanning for fixable issues...${RESET}`);
  console.log();

  const { checks } = await collectFixableChecks(projectPath, options);

  if (checks.length === 0) {
    console.log(`${GREEN}No fixable issues found${RESET}`);
    console.log();
    return;
  }

  console.log(
    `Found ${BOLD}${checks.length}${RESET} fixable issue${checks.length > 1 ? "s" : ""}:`,
  );
  console.log();

  for (const check of checks) {
    const optionInfo =
      check.hasOptions && check.optionIds
        ? ` ${DIM}(options: ${check.optionIds.join(", ")})${RESET}`
        : "";
    console.log(`  ${YELLOW}${check.name}${RESET}${optionInfo}`);
    console.log(`    ${DIM}${check.message}${RESET}`);
  }

  console.log();
  console.log(`Run ${BOLD}project-doctor fix all${RESET} to fix all issues`);
  console.log(`Run ${BOLD}project-doctor fix <check-name>${RESET} to fix a specific issue`);
  console.log();
}

export type FixRunOptions = FixFilterOptions & {
  pick?: string;
};

/**
 * Fix all fixable issues automatically.
 *
 * Scans the project, identifies failing checks with fixes,
 * and applies all fixes in priority order.
 *
 * @param projectPath - Absolute path to the project directory
 * @param options - Filter options and fix selection
 * @returns Exit code: 0 if all fixes succeeded, 1 if any failed
 */
export async function runFixAll(projectPath: string, options: FixRunOptions = {}): Promise<number> {
  console.log();
  console.log(`${DIM}Scanning for fixable issues...${RESET}`);
  console.log();

  const { checks } = await collectFixableChecks(projectPath, options);

  if (checks.length === 0) {
    console.log(`${GREEN}No fixable issues found${RESET}`);
    console.log();
    return 0;
  }

  console.log(`Fixing ${BOLD}${checks.length}${RESET} issue${checks.length > 1 ? "s" : ""}...`);
  console.log();

  let fixed = 0;
  let failed = 0;

  for (const check of checks) {
    console.log(`  ${check.name}...`);
    try {
      const fixResult = await check.runFix(options.pick);
      if (fixResult.success) {
        console.log(`    ${GREEN}✓ ${fixResult.message}${RESET}`);
        fixed++;
      } else {
        console.log(`    ${RED}✗ ${fixResult.message}${RESET}`);
        failed++;
      }
    } catch (error) {
      console.log(
        `    ${RED}✗ Error: ${error instanceof Error ? error.message : "Unknown error"}${RESET}`,
      );
      failed++;
    }
  }

  console.log();
  if (failed > 0) {
    console.log(`${GREEN}✓ ${fixed} fixed${RESET}, ${RED}✗ ${failed} failed${RESET}`);
  } else {
    console.log(`${GREEN}✓ ${fixed} fixed${RESET}`);
  }
  console.log();

  return failed > 0 ? 1 : 0;
}

/**
 * Fix a specific check by name.
 *
 * Validates the check exists, runs it to confirm failure,
 * then applies the fix.
 *
 * @param projectPath - Absolute path to the project directory
 * @param checkName - Name of the check to fix
 * @param options - Fix selection options
 * @returns Exit code: 0 if fixed, 1 if fix failed, 2 if check not found
 */
export async function runFixOne(
  projectPath: string,
  checkName: string,
  options: FixRunOptions = {},
): Promise<number> {
  // Validate check name
  const validChecks = getValidCheckNames();
  if (!validChecks.has(checkName)) {
    console.error(`${RED}Error: Unknown check "${checkName}".${RESET}`);
    console.error('Run "project-doctor fix" to see fixable issues.');
    return 2;
  }

  console.log();
  console.log(`${DIM}Checking ${checkName}...${RESET}`);
  console.log();

  const { checks } = await collectFixableChecks(projectPath, {});

  const check = checks.find((c) => c.name === checkName);

  if (!check) {
    console.log(`${GREEN}Check "${checkName}" is passing or not fixable${RESET}`);
    console.log();
    return 0;
  }

  console.log(`Fixing ${BOLD}${check.name}${RESET}...`);

  try {
    const fixResult = await check.runFix(options.pick);
    if (fixResult.success) {
      console.log(`  ${GREEN}✓ ${fixResult.message}${RESET}`);
      console.log();
      return 0;
    } else {
      console.log(`  ${RED}✗ ${fixResult.message}${RESET}`);
      console.log();
      return 1;
    }
  } catch (error) {
    console.log(
      `  ${RED}✗ Error: ${error instanceof Error ? error.message : "Unknown error"}${RESET}`,
    );
    console.log();
    return 1;
  }
}
