import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { select } from "@inquirer/prompts";
import JSON5 from "json5";
import type { CheckResult, CheckResultBase, FixResult, GlobalContext, CheckTag } from "../types.js";
import { checkGroups } from "../registry.js";
import { sortByChainAndPriority, getChainRoot } from "./fix-chains.js";
import { createGlobalContext } from "../context/global.js";

type FixableCheck = {
  name: string;
  group: string;
  tags: CheckTag[];
  result: CheckResult;
  fixDescription: string;
  runFix: () => Promise<FixResult>;
};

// Priority scoring for fix order: lower score = higher priority
// Importance: required=0, recommended=1, opinionated=2
// Effort: low=0, medium=1, high=2 (from chain root)
// Priority = importance * 3 + effort
function getFixPriority(tags: CheckTag[], rootTags?: CheckTag[]): number {
  const importance = tags.includes("required") ? 0
    : tags.includes("recommended") ? 1 : 2;

  // Use root's effort level - the true effort is determined by the chain root
  const effortTags = rootTags ?? tags;
  const effort = effortTags.includes("effort:low") ? 0
    : effortTags.includes("effort:medium") ? 1 : 2;

  return importance * 3 + effort;
}

type SelectOption = "fix" | "disable" | "skip";

async function selectAction(): Promise<SelectOption> {
  return select({
    message: "What do you want to do?",
    choices: [
      { name: "Apply fix", value: "fix" as const },
      { name: "Disable check", value: "disable" as const },
      { name: "Skip for now", value: "skip" as const },
    ],
  });
}

async function addToExcludeChecks(projectPath: string, checkName: string): Promise<void> {
  const configDir = join(projectPath, ".project-doctor");
  const configPath = join(configDir, "config.json5");
  await mkdir(configDir, { recursive: true });

  let config: Record<string, unknown> = {};
  try {
    const content = await readFile(configPath, "utf-8");
    config = JSON5.parse(content);
  } catch {
    // No existing config, start fresh
  }

  const excludeChecks = (config.excludeChecks as string[]) ?? [];
  if (!excludeChecks.includes(checkName)) {
    excludeChecks.push(checkName);
  }
  config.excludeChecks = excludeChecks;

  await writeFile(configPath, JSON5.stringify(config, null, 2) + "\n", "utf-8");
}

export type FixerOptions = {
  projectPath: string;
  autoFix?: boolean;
};

export async function runFixer(options: FixerOptions): Promise<void> {
  const global = await createGlobalContext(options.projectPath);
  const fixableChecks: FixableCheck[] = [];

  console.log();
  console.log("\x1b[90m  Scanning for fixable issues...\x1b[0m");
  console.log();

  // Run all checks and collect fixable failures
  for (const group of checkGroups) {
    const groupContext = await group.loadContext(global);

    for (const check of group.checks) {
      if (!check.fix) continue;

      const baseResult = await (check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>)(
        global,
        groupContext
      );

      if (baseResult.status === "fail") {
        const result: CheckResult = { ...baseResult, group: group.name };
        fixableChecks.push({
          name: check.name,
          group: group.name,
          tags: check.tags,
          result,
          fixDescription: check.fix.description,
          runFix: () => (check.fix as { run: (g: GlobalContext, c: unknown) => Promise<FixResult> }).run(global, groupContext),
        });
      }
    }
  }

  // Build a map of check name → tags for chain root lookups
  const tagsByName = new Map<string, CheckTag[]>();
  for (const check of fixableChecks) {
    tagsByName.set(check.name, check.tags);
  }

  // Sort by: 1) dependency chain order, 2) priority using chain root's effort
  const sortedChecks = sortByChainAndPriority(fixableChecks, (check) => {
    // Use the chain root's effort level for priority calculation
    const rootName = getChainRoot(check.name);
    const rootTags = tagsByName.get(rootName) ?? check.tags;
    return getFixPriority(check.tags, rootTags);
  });
  fixableChecks.length = 0;
  fixableChecks.push(...sortedChecks);

  if (fixableChecks.length === 0) {
    console.log("  \x1b[32m✓ No fixable issues found\x1b[0m");
    console.log();
    return;
  }

  console.log(`  Found \x1b[1m${fixableChecks.length}\x1b[0m fixable issue${fixableChecks.length > 1 ? "s" : ""}`);
  console.log();

  let fixed = 0;
  let skipped = 0;
  let disabled = 0;

  for (let i = 0; i < fixableChecks.length; i++) {
    const check = fixableChecks[i];
    const statusColor = "\x1b[31m";
    const statusIcon = "✗";

    // Issue header
    console.log("\x1b[90m  ─────────────────────────────────────────\x1b[0m");
    console.log();
    console.log(`  ${statusColor}${statusIcon}\x1b[0m  \x1b[1m${check.name}\x1b[0m  \x1b[90m(${i + 1}/${fixableChecks.length})\x1b[0m`);
    console.log(`     ${check.result.message}`);
    console.log();
    console.log(`     \x1b[36mFix:\x1b[0m ${check.fixDescription}`);
    console.log();

    let action: SelectOption = "skip";

    if (options.autoFix) {
      action = "fix";
    } else {
      action = await selectAction();
    }

    if (action === "fix") {
      try {
        const fixResult = await check.runFix();
        if (fixResult.success) {
          console.log(`     \x1b[32m✓ ${fixResult.message}\x1b[0m`);
          fixed++;
        } else {
          console.log(`     \x1b[31m✗ ${fixResult.message}\x1b[0m`);
        }
      } catch (error) {
        console.log(`     \x1b[31m✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m`);
      }
    } else if (action === "disable") {
      try {
        await addToExcludeChecks(options.projectPath, check.name);
        console.log(`     \x1b[33m⊘ Disabled in config\x1b[0m`);
        disabled++;
      } catch (error) {
        console.log(`     \x1b[31m✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m`);
      }
    } else {
      console.log(`     \x1b[90m→ Skipped\x1b[0m`);
      skipped++;
    }
    console.log();
  }

  // Summary
  console.log("\x1b[90m  ─────────────────────────────────────────\x1b[0m");
  console.log();
  console.log("  \x1b[1mSummary\x1b[0m");
  console.log();
  if (fixed > 0) console.log(`     \x1b[32m✓ ${fixed} fixed\x1b[0m`);
  if (disabled > 0) console.log(`     \x1b[33m⊘ ${disabled} disabled\x1b[0m`);
  if (skipped > 0) console.log(`     \x1b[90m→ ${skipped} skipped\x1b[0m`);
  console.log();
}
