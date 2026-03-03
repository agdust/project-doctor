import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGlobalContext } from "../context/global.js";
import { ensureConfigDir } from "../config/constants.js";
import { runAllChecksRaw } from "./runner.js";
import { safeJsonParse } from "./safe-json.js";
import { bold, dim, red, green } from "./colors.js";

interface SnapshotEntry {
  date: string;
  checks: {
    total: number;
    passed: number;
    failed: number;
  };
  failingChecks: string[];
}

const HISTORY_DIR = ".project-doctor";
const HISTORY_FILE = "history.json";

// AGENT: seems like this code is used somewhere else, maybe it's worth to put it into the util?
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function loadHistory(projectPath: string): Promise<SnapshotEntry[]> {
  const historyPath = path.join(projectPath, HISTORY_DIR, HISTORY_FILE);
  try {
    const content = await readFile(historyPath, "utf8");
    return safeJsonParse<SnapshotEntry[]>(content) ?? [];
  } catch {
    // History file doesn't exist yet
    return [];
  }
}

async function saveHistory(projectPath: string, history: SnapshotEntry[]): Promise<void> {
  const historyPath = path.join(projectPath, HISTORY_DIR, HISTORY_FILE);

  await ensureConfigDir(projectPath);
  await writeFile(historyPath, JSON.stringify(history, null, 2) + "\n", "utf8");
}

export async function takeSnapshot(projectPath: string): Promise<SnapshotEntry> {
  const global = await createGlobalContext(projectPath);

  // Run all checks
  // AGENT: shouldnt here project configuration be respected? Why we call Raw here?
  const checkResults = await runAllChecksRaw(global);

  const failingChecks = checkResults.filter((r) => r.status === "fail").map((r) => r.name);

  return {
    date: getToday(),
    checks: {
      total: checkResults.length,
      passed: checkResults.filter((r) => r.status === "pass").length,
      failed: checkResults.filter((r) => r.status === "fail").length,
    },
    failingChecks,
  };
}

export async function runSnapshot(projectPath: string): Promise<void> {
  console.log();
  console.log(`  ${dim("Taking snapshot...")}`);

  const snapshot = await takeSnapshot(projectPath);
  const history = await loadHistory(projectPath);

  // Replace or append today's entry
  const existingIndex = history.findIndex((e) => e.date === snapshot.date);
  if (existingIndex === -1) {
    history.push(snapshot);
  } else {
    history[existingIndex] = snapshot;
  }

  // Sort by date
  history.sort((a, b) => a.date.localeCompare(b.date));

  await saveHistory(projectPath, history);

  console.log();
  console.log(`  ${green("✓")} Snapshot saved for ${snapshot.date}`);
  console.log(`    ${snapshot.checks.passed}/${snapshot.checks.total} checks passing`);
  console.log();
  console.log(`  ${dim(`Saved to ${HISTORY_DIR}/${HISTORY_FILE}`)}`);
  console.log();
}

export async function runHistory(projectPath: string): Promise<void> {
  const history = await loadHistory(projectPath);

  console.log();

  if (history.length === 0) {
    console.log(`  ${dim("No snapshots yet. Run 'project-doctor snapshot' to create one.")}`);
    console.log();
    return;
  }

  console.log(`  ${bold("Project Health History")}`);
  console.log();
  console.log(`  ${dim("Date          Checks")}`);
  console.log(`  ${dim("─────────────────────────")}`);

  for (const entry of history) {
    const checkStatus = entry.checks.failed === 0 ? green("✓") : red("✗");
    const checkText = `${entry.checks.passed}/${entry.checks.total}`;

    console.log(`  ${entry.date}    ${checkStatus} ${checkText}`);
  }

  // Show progress if multiple entries
  if (history.length >= 2) {
    const first = history[0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- history.length >= 2 guaranteed above
    const last = history.at(-1)!;
    const checkDiff = last.checks.failed - first.checks.failed;

    console.log();
    if (checkDiff < 0) {
      console.log(
        `  ${green(`↑ Fixed ${Math.abs(checkDiff)} issue${Math.abs(checkDiff) > 1 ? "s" : ""} since ${first.date}`)}`,
      );
    } else if (checkDiff > 0) {
      console.log(
        `  ${red(`↓ ${checkDiff} new issue${checkDiff > 1 ? "s" : ""} since ${first.date}`)}`,
      );
    } else {
      console.log(`  ${dim(`→ No change since ${first.date}`)}`);
    }
  }

  console.log();
}
