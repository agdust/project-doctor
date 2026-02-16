/**
 * Auto-fixer for project-doctor
 *
 * Runs all available fixes without prompts.
 * For interactive fixing, use `project-doctor app` instead.
 */

import type { CheckResultBase, FixResult, GlobalContext, CheckTag } from "../types.js";
import { checkGroups } from "../registry.js";
import { sortFixableChecks } from "./fix-chains.js";
import { createGlobalContext } from "../context/global.js";
import { isGroupForProjectType } from "./checks.js";

interface FixableCheck {
  name: string;
  tags: CheckTag[];
  runFix: () => Promise<FixResult>;
}

export interface AutoFixOptions {
  projectPath: string;
}

/**
 * Run all available fixes without prompts.
 * Returns count of successful fixes.
 */
export async function runAutoFix(options: AutoFixOptions): Promise<number> {
  const global = await createGlobalContext(options.projectPath);
  const fixableChecks: FixableCheck[] = [];

  console.log();
  console.log("\x1b[90m  Scanning for fixable issues...\x1b[0m");
  console.log();

  // Filter groups based on project type
  const groupsToRun = checkGroups.filter((g) =>
    isGroupForProjectType(g.name, global.config.projectType),
  );

  // Run all checks and collect fixable failures
  for (const group of groupsToRun) {
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      if (!check.fix) continue;

      const baseResult = await (
        check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>
      )(global, groupContext);

      if (baseResult.status === "fail") {
        fixableChecks.push({
          name: check.name,
          tags: check.tags,
          runFix: () =>
            (check.fix as { run: (g: GlobalContext, c: unknown) => Promise<FixResult> }).run(
              global,
              groupContext,
            ),
        });
      }
    }
  }

  const sortedChecks = sortFixableChecks(fixableChecks);

  if (sortedChecks.length === 0) {
    console.log("  \x1b[32m✓ No fixable issues found\x1b[0m");
    console.log();
    return 0;
  }

  console.log(
    `  Found \x1b[1m${sortedChecks.length}\x1b[0m fixable issue${sortedChecks.length > 1 ? "s" : ""}`,
  );
  console.log();

  // Run all fixes
  let fixed = 0;
  for (const check of sortedChecks) {
    console.log(`  Fixing ${check.name}...`);
    try {
      const fixResult = await check.runFix();
      if (fixResult.success) {
        console.log(`     \x1b[32m✓ ${fixResult.message}\x1b[0m`);
        fixed++;
      } else {
        console.log(`     \x1b[31m✗ ${fixResult.message}\x1b[0m`);
      }
    } catch (error) {
      console.log(
        `     \x1b[31m✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m`,
      );
    }
  }

  console.log();
  console.log(`  \x1b[32m✓ ${fixed} fixed\x1b[0m`);
  console.log();

  return fixed;
}
