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

import type { FixResult, GlobalContext, CheckTag } from "../types.js";
import { sortFixableChecks, removeBlockedChecks } from "../utils/fix-chains.js";
import { createGlobalContext } from "../context/global.js";
import { getValidCheckNames } from "../utils/checks.js";
import { bold, dim, green, red, yellow } from "../utils/colors.js";
import { blank, ICONS } from "../cli-framework/renderer.js";
import { loadAndRunChecks, extractFixableEntries } from "../utils/check-loader.js";

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

export interface FixFilterOptions {
  groups?: string[];
  tags?: string[];
}

async function collectFixableChecks(
  projectPath: string,
  options: FixFilterOptions,
): Promise<{ checks: FixableCheck[]; global: GlobalContext }> {
  const global = await createGlobalContext(projectPath);

  const { groups: groupResults } = await loadAndRunChecks(global, {
    groups: options.groups,
    includeTags: options.tags as CheckTag[] | undefined,
  });

  const entries = extractFixableEntries(global, groupResults);

  const fixableChecks: FixableCheck[] = entries.map((entry) => {
    const { fixOptions } = entry;
    const hasOptions = fixOptions !== undefined && fixOptions.length > 0;
    const optionIds = hasOptions ? fixOptions.map((o) => o.id) : undefined;

    return {
      name: entry.check.name,
      group: entry.groupName,
      tags: entry.check.tags,
      message: entry.result.message,
      fixDescription: entry.fixDescription,
      hasOptions,
      optionIds,
      runFix: async (pickOption?: string) => {
        if (hasOptions) {
          const optionToUse = pickOption ?? fixOptions[0]?.id;
          const option = fixOptions.find((o) => o.id === optionToUse);
          if (!option) {
            return { success: false, message: `Unknown fix option: ${optionToUse}` };
          }
          return option.runFix();
        } else if (entry.runFix) {
          return entry.runFix();
        }
        return { success: false, message: "No fix available" };
      },
    };
  });

  return { checks: sortFixableChecks(removeBlockedChecks(fixableChecks)), global };
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
  blank();
  console.log(dim("Scanning for fixable issues..."));
  blank();

  const { checks } = await collectFixableChecks(projectPath, options);

  if (checks.length === 0) {
    console.log(green("No fixable issues found"));
    blank();
    return;
  }

  console.log(`Found ${bold(String(checks.length))} fixable issue${checks.length > 1 ? "s" : ""}:`);
  blank();

  for (const check of checks) {
    const optionInfo =
      check.hasOptions && check.optionIds
        ? ` ${dim(`(options: ${check.optionIds.join(", ")})`)}`
        : "";
    console.log(`  ${yellow(check.name)}${optionInfo}`);
    console.log(`    ${dim(check.message)}`);
  }

  blank();
  console.log(`Run ${bold("project-doctor fix all")} to fix all issues`);
  console.log(`Run ${bold("project-doctor fix <check-name>")} to fix a specific issue`);
  blank();
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
  blank();
  console.log(dim("Scanning for fixable issues..."));
  blank();

  const { checks } = await collectFixableChecks(projectPath, options);

  // Multi-option checks require manual selection — exclude from autofix
  const autoFixable = checks.filter((c) => !c.hasOptions);
  const skippedMultiOption = checks.filter((c) => c.hasOptions);

  if (autoFixable.length === 0 && skippedMultiOption.length === 0) {
    console.log(green("No fixable issues found"));
    blank();
    return 0;
  }

  if (autoFixable.length === 0) {
    console.log(dim("No auto-fixable issues found."));
    blank();
  } else {
    console.log(
      `Fixing ${bold(String(autoFixable.length))} issue${autoFixable.length > 1 ? "s" : ""}...`,
    );
    blank();
  }

  let fixed = 0;
  let failed = 0;

  for (const check of autoFixable) {
    console.log(`  ${check.name}...`);
    try {
      const fixResult = await check.runFix(options.pick);
      if (fixResult.success) {
        console.log(`    ${green(`${ICONS.pass} ${fixResult.message}`)}`);
        fixed++;
      } else {
        console.log(`    ${red(`${ICONS.fail} ${fixResult.message}`)}`);
        failed++;
      }
    } catch (error) {
      console.log(
        `    ${red(`${ICONS.fail} Error: ${error instanceof Error ? error.message : "Unknown error"}`)}`,
      );
      failed++;
    }
  }

  if (skippedMultiOption.length > 0) {
    blank();
    console.log(
      dim(
        `Skipped ${skippedMultiOption.length} check${skippedMultiOption.length > 1 ? "s" : ""} requiring manual option selection:`,
      ),
    );
    for (const check of skippedMultiOption) {
      console.log(`  ${dim(check.name)} ${dim(`(options: ${check.optionIds?.join(", ")})`)}`);
    }
    console.log(dim(`Use "project-doctor fix <check-name> --pick <option>" to fix these.`));
  }

  blank();
  if (fixed > 0 || failed > 0) {
    if (failed > 0) {
      console.log(
        `${green(`${ICONS.pass} ${fixed} fixed`)}, ${red(`${ICONS.fail} ${failed} failed`)}`,
      );
    } else {
      console.log(green(`${ICONS.pass} ${fixed} fixed`));
    }
    blank();
  }

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
    console.error(red(`Error: Unknown check "${checkName}".`));
    console.error('Run "project-doctor fix" to see fixable issues.');
    return 2;
  }

  blank();
  console.log(dim(`Checking ${checkName}...`));
  blank();

  const { checks } = await collectFixableChecks(projectPath, {});

  const check = checks.find((c) => c.name === checkName);

  if (!check) {
    console.log(green(`Check "${checkName}" is passing or not fixable`));
    blank();
    return 0;
  }

  console.log(`Fixing ${bold(check.name)}...`);

  try {
    const fixResult = await check.runFix(options.pick);
    if (fixResult.success) {
      console.log(`  ${green(`${ICONS.pass} ${fixResult.message}`)}`);
      blank();
      return 0;
    } else {
      console.log(`  ${red(`${ICONS.fail} ${fixResult.message}`)}`);
      blank();
      return 1;
    }
  } catch (error) {
    console.log(
      `  ${red(`${ICONS.fail} Error: ${error instanceof Error ? error.message : "Unknown error"}`)}`,
    );
    blank();
    return 1;
  }
}
