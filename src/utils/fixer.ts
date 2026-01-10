import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import JSON5 from "json5";
import type { CheckResult, CheckResultBase, FixResult, GlobalContext, CheckTag } from "../types.js";
import { checkGroups } from "../registry.js";
import { sortByChainAndPriority, getChainRoot } from "./fix-chains.js";
import { createGlobalContext } from "../context/global.js";
import { runWizard, type WizardStep } from "./interactive-wizard/index.js";

type FixableCheck = {
  name: string;
  group: string;
  tags: CheckTag[];
  result: CheckResult;
  fixDescription: string;
  why: string | null;
  runFix: () => Promise<FixResult>;
};

type FixerContext = {
  projectPath: string;
  checks: FixableCheck[];
  fixed: number;
  skipped: number;
  disabled: number;
};

type FixAction = "fix" | "why" | "disable" | "skip";

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

// Get the package src directory (works both in dev and when installed)
// __dirname is either src/utils or dist/utils, so go up two levels to package root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, "..", "..");
const CHECKS_SRC = join(PACKAGE_ROOT, "src", "checks");

/**
 * Extract the "Why" section from a check's docs.md file.
 * Returns the content between "## Why" and the next "##" heading.
 */
async function loadWhyFromDocs(group: string, checkName: string): Promise<string | null> {
  // Check name like "gitignore-exists" → folder "exists" in group "gitignore"
  // Check name like "package-json-has-name" → folder "has-name" in group "package-json"
  const checkFolder = checkName.startsWith(`${group}-`)
    ? checkName.slice(group.length + 1)
    : checkName;

  const docsPath = join(CHECKS_SRC, group, checkFolder, "docs.md");

  try {
    const content = await readFile(docsPath, "utf-8");
    const whyMatch = content.match(/## Why\n\n([\s\S]*?)(?=\n## |$)/);
    if (whyMatch) {
      return whyMatch[1].trim();
    }
  } catch {
    // No docs file
  }

  return null;
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

/**
 * Create wizard steps from fixable checks
 */
function createFixSteps(checks: FixableCheck[]): WizardStep<FixerContext, FixAction>[] {
  return checks.map((check, index) => ({
    id: check.name,
    render: (ctx, stepIndex, totalSteps) => {
      const statusColor = "\x1b[31m";
      const statusIcon = "✗";

      console.log("\x1b[90m  ─────────────────────────────────────────\x1b[0m");
      console.log();
      console.log(`  ${statusColor}${statusIcon}\x1b[0m  \x1b[1m${check.name}\x1b[0m  \x1b[90m(${stepIndex}/${totalSteps})\x1b[0m`);
      console.log(`     ${check.result.message}`);
      console.log();
      console.log(`     \x1b[36mFix:\x1b[0m ${check.fixDescription}`);
      console.log();
    },
    getActions: () => {
      const actions: Array<{ value: FixAction; label: string }> = [
        { value: "fix", label: "Apply fix" },
      ];

      if (check.why) {
        actions.push({ value: "why", label: "Why?" });
      }

      actions.push(
        { value: "disable", label: "Disable check" },
        { value: "skip", label: "Skip for now" }
      );

      return actions;
    },
    onAction: async (action, ctx) => {
      if (action === "why" && check.why) {
        console.log();
        console.log("\x1b[90m     ─────────────────────────────────────\x1b[0m");
        console.log();
        const lines = check.why.split("\n");
        for (const line of lines) {
          console.log(`     ${line}`);
        }
        console.log();
        console.log("\x1b[90m     ─────────────────────────────────────\x1b[0m");
        console.log();
        return false; // Repeat this step to show menu again
      }

      if (action === "fix") {
        try {
          const fixResult = await check.runFix();
          if (fixResult.success) {
            console.log(`     \x1b[32m✓ ${fixResult.message}\x1b[0m`);
            ctx.fixed++;
          } else {
            console.log(`     \x1b[31m✗ ${fixResult.message}\x1b[0m`);
          }
        } catch (error) {
          console.log(`     \x1b[31m✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m`);
        }
        console.log();
        return true;
      }

      if (action === "disable") {
        try {
          await addToExcludeChecks(ctx.projectPath, check.name);
          console.log(`     \x1b[33m⊘ Disabled in config\x1b[0m`);
          ctx.disabled++;
        } catch (error) {
          console.log(`     \x1b[31m✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m`);
        }
        console.log();
        return true;
      }

      // skip
      console.log(`     \x1b[90m→ Skipped\x1b[0m`);
      console.log();
      ctx.skipped++;
      return true;
    },
  }));
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
        const why = await loadWhyFromDocs(group.name, check.name);
        fixableChecks.push({
          name: check.name,
          group: group.name,
          tags: check.tags,
          result,
          fixDescription: check.fix.description,
          why,
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

  if (sortedChecks.length === 0) {
    console.log("  \x1b[32m✓ No fixable issues found\x1b[0m");
    console.log();
    return;
  }

  console.log(`  Found \x1b[1m${sortedChecks.length}\x1b[0m fixable issue${sortedChecks.length > 1 ? "s" : ""}`);
  console.log();

  // Auto-fix mode: run all fixes without prompts
  if (options.autoFix) {
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
        console.log(`     \x1b[31m✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m`);
      }
    }
    console.log();
    console.log(`  \x1b[32m✓ ${fixed} fixed\x1b[0m`);
    console.log();
    return;
  }

  // Interactive mode: use wizard
  const context: FixerContext = {
    projectPath: options.projectPath,
    checks: sortedChecks,
    fixed: 0,
    skipped: 0,
    disabled: 0,
  };

  const steps = createFixSteps(sortedChecks);

  await runWizard(steps, {
    context,
    allowBack: true,
    backLabel: "← Previous issue",
    onComplete: (ctx) => {
      // Summary
      console.log("\x1b[90m  ─────────────────────────────────────────\x1b[0m");
      console.log();
      console.log("  \x1b[1mSummary\x1b[0m");
      console.log();
      if (ctx.fixed > 0) console.log(`     \x1b[32m✓ ${ctx.fixed} fixed\x1b[0m`);
      if (ctx.disabled > 0) console.log(`     \x1b[33m⊘ ${ctx.disabled} disabled\x1b[0m`);
      if (ctx.skipped > 0) console.log(`     \x1b[90m→ ${ctx.skipped} skipped\x1b[0m`);
      console.log();
    },
    onCancel: (ctx) => {
      console.log();
      console.log("  \x1b[33m⚠ Cancelled\x1b[0m");
      console.log();
      if (ctx.fixed > 0) console.log(`     \x1b[32m✓ ${ctx.fixed} fixed before cancel\x1b[0m`);
      console.log();
    },
  });
}
