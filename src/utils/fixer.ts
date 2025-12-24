import { createInterface } from "node:readline";
import type { CheckResult, CheckResultBase, FixResult, GlobalContext } from "../types.js";
import { checkGroups } from "../registry.js";
import { createGlobalContext } from "../context/global.js";

type FixableCheck = {
  name: string;
  group: string;
  result: CheckResult;
  fixDescription: string;
  runFix: () => Promise<FixResult>;
};

async function prompt(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

export type FixerOptions = {
  projectPath: string;
  autoFix?: boolean;
};

export async function runFixer(options: FixerOptions): Promise<void> {
  const global = await createGlobalContext(options.projectPath);
  const fixableChecks: FixableCheck[] = [];

  console.log("\nScanning for issues...\n");

  // Run all checks and collect fixable failures
  for (const group of checkGroups) {
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      if (!check.fix) continue;

      const baseResult = await (check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>)(
        global,
        groupContext
      );

      if (baseResult.status === "fail" || baseResult.status === "warn") {
        const result: CheckResult = { ...baseResult, group: group.name };
        fixableChecks.push({
          name: check.name,
          group: group.name,
          result,
          fixDescription: check.fix.description,
          runFix: () => (check.fix as { run: (g: GlobalContext, c: unknown) => Promise<FixResult> }).run(global, groupContext),
        });
      }
    }
  }

  if (fixableChecks.length === 0) {
    console.log("\x1b[32mNo fixable issues found.\x1b[0m\n");
    return;
  }

  console.log(`Found ${fixableChecks.length} fixable issue(s):\n`);

  let fixed = 0;
  let skipped = 0;

  for (const check of fixableChecks) {
    const statusColor = check.result.status === "fail" ? "\x1b[31m" : "\x1b[33m";
    const statusText = check.result.status === "fail" ? "FAIL" : "WARN";

    console.log(`${statusColor}[${statusText}]\x1b[0m ${check.name}`);
    console.log(`       ${check.result.message}`);
    console.log(`  \x1b[36mFix:\x1b[0m ${check.fixDescription}`);

    let shouldFix = options.autoFix ?? false;
    if (!shouldFix) {
      shouldFix = await prompt("  Apply fix? [y/N] ");
    }

    if (shouldFix) {
      try {
        const fixResult = await check.runFix();
        if (fixResult.success) {
          console.log(`  \x1b[32m✓ ${fixResult.message}\x1b[0m\n`);
          fixed++;
        } else {
          console.log(`  \x1b[31m✗ ${fixResult.message}\x1b[0m\n`);
        }
      } catch (error) {
        console.log(`  \x1b[31m✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m\n`);
      }
    } else {
      console.log("  \x1b[90mSkipped\x1b[0m\n");
      skipped++;
    }
  }

  console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`);
}
