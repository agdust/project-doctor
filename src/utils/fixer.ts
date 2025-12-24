import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
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

type SelectOption = "fix" | "disable" | "skip";

const OPTIONS: SelectOption[] = ["fix", "disable", "skip"];

async function selectOption(): Promise<SelectOption> {
  return new Promise((resolve) => {
    let selectedIndex = 0;

    const render = () => {
      // Move cursor up and clear previous render (except first render)
      process.stdout.write("\x1b[?25l"); // Hide cursor

      const line = OPTIONS.map((opt, i) => {
        if (i === selectedIndex) {
          return `\x1b[7m ${opt} \x1b[0m`; // Inverted colors for selection
        }
        return ` ${opt} `;
      }).join("  ");

      process.stdout.write(`\r\x1b[K  ${line}`);
    };

    render();

    if (!process.stdin.isTTY) {
      process.stdout.write("\n");
      resolve("skip");
      return;
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onKeypress = (key: Buffer) => {
      const char = key.toString();

      // Arrow keys
      if (char === "\x1b[D" || char === "\x1b[A") {
        // Left or Up
        selectedIndex = (selectedIndex - 1 + OPTIONS.length) % OPTIONS.length;
        render();
      } else if (char === "\x1b[C" || char === "\x1b[B") {
        // Right or Down
        selectedIndex = (selectedIndex + 1) % OPTIONS.length;
        render();
      } else if (char === "\r" || char === "\n") {
        // Enter
        cleanup();
        process.stdout.write("\x1b[?25h"); // Show cursor
        process.stdout.write("\n");
        resolve(OPTIONS[selectedIndex]);
      } else if (char === "\x03") {
        // Ctrl+C
        cleanup();
        process.stdout.write("\x1b[?25h");
        process.stdout.write("\n");
        process.exit(0);
      }
    };

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onKeypress);
    };

    process.stdin.on("data", onKeypress);
  });
}

async function addToExcludeChecks(projectPath: string, checkName: string): Promise<void> {
  const configPath = join(projectPath, ".project-doctorrc.json");

  let config: Record<string, unknown> = {};
  try {
    const content = await readFile(configPath, "utf-8");
    config = JSON.parse(content);
  } catch {
    // No existing config, start fresh
  }

  const excludeChecks = (config.excludeChecks as string[]) ?? [];
  if (!excludeChecks.includes(checkName)) {
    excludeChecks.push(checkName);
  }
  config.excludeChecks = excludeChecks;

  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
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
  let disabled = 0;

  for (const check of fixableChecks) {
    const statusColor = check.result.status === "fail" ? "\x1b[31m" : "\x1b[33m";
    const statusText = check.result.status === "fail" ? "FAIL" : "WARN";

    console.log(`${statusColor}[${statusText}]\x1b[0m ${check.name}`);
    console.log(`       ${check.result.message}`);
    console.log(`  \x1b[36mFix:\x1b[0m ${check.fixDescription}`);

    let action: SelectOption = "skip";

    if (options.autoFix) {
      action = "fix";
    } else {
      action = await selectOption();
    }

    if (action === "fix") {
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
    } else if (action === "disable") {
      try {
        await addToExcludeChecks(options.projectPath, check.name);
        console.log(`  \x1b[33m⊘ Disabled ${check.name}\x1b[0m\n`);
        disabled++;
      } catch (error) {
        console.log(`  \x1b[31m✗ Error disabling: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m\n`);
      }
    } else {
      console.log(`  \x1b[90m→ Skipped\x1b[0m\n`);
      skipped++;
    }
  }

  console.log(`\nDone: ${fixed} fixed, ${disabled} disabled, ${skipped} skipped`);
}
