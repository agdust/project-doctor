import { readFile } from "node:fs/promises";
import path from "node:path";
import { ensureConfigDir } from "../config/constants.js";
import { runChecks } from "./runner.js";
import { safeJsonParse } from "./safe-json.js";
import { bold, dim, red, green } from "./colors.js";
import { blank, ICONS } from "../cli-framework/renderer.js";
import { atomicWriteFile } from "./safe-fs.js";
import { toDateString } from "./dates.js";

export interface SnapshotEntry {
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

function getToday(): string {
  return toDateString(new Date());
}

export async function loadHistory(projectPath: string): Promise<SnapshotEntry[]> {
  const historyPath = path.join(projectPath, HISTORY_DIR, HISTORY_FILE);
  try {
    const content = await readFile(historyPath, "utf8");
    return safeJsonParse<SnapshotEntry[]>(content) ?? [];
  } catch {
    // History file doesn't exist yet
    return [];
  }
}

export async function saveHistory(projectPath: string, history: SnapshotEntry[]): Promise<void> {
  const historyPath = path.join(projectPath, HISTORY_DIR, HISTORY_FILE);

  await ensureConfigDir(projectPath);
  await atomicWriteFile(historyPath, JSON.stringify(history, null, 2) + "\n");
}

export interface SnapshotCheckResult {
  status: string;
  name: string;
}

export function createSnapshotFromResults(results: SnapshotCheckResult[]): SnapshotEntry {
  const failingChecks = results.filter((r) => r.status === "fail").map((r) => r.name);

  return {
    date: getToday(),
    checks: {
      total: results.length,
      passed: results.filter((r) => r.status === "pass").length,
      failed: results.filter((r) => r.status === "fail").length,
    },
    failingChecks,
  };
}

export async function takeSnapshot(projectPath: string): Promise<SnapshotEntry> {
  const { results: checkResults } = await runChecks({ projectPath });
  return createSnapshotFromResults(checkResults);
}

/**
 * Insert or replace today's snapshot entry in history, sort by date, and save.
 * Returns the updated history array.
 */
export async function upsertSnapshot(
  projectPath: string,
  snapshot: SnapshotEntry,
): Promise<SnapshotEntry[]> {
  const history = await loadHistory(projectPath);

  const existingIndex = history.findIndex((e) => e.date === snapshot.date);
  if (existingIndex === -1) {
    history.push(snapshot);
  } else {
    history[existingIndex] = snapshot;
  }

  history.sort((a, b) => a.date.localeCompare(b.date));
  await saveHistory(projectPath, history);
  return history;
}

export async function runSnapshot(projectPath: string): Promise<void> {
  blank();
  console.log(`  ${dim("Taking snapshot...")}`);

  const snapshot = await takeSnapshot(projectPath);
  await upsertSnapshot(projectPath, snapshot);

  blank();
  console.log(`  ${green(ICONS.pass)} Snapshot saved for ${snapshot.date}`);
  console.log(`    ${snapshot.checks.passed}/${snapshot.checks.total} checks passing`);
  blank();
  console.log(`  ${dim(`Saved to ${HISTORY_DIR}/${HISTORY_FILE}`)}`);
  blank();
}

export async function runHistory(projectPath: string): Promise<void> {
  const history = await loadHistory(projectPath);

  blank();

  if (history.length === 0) {
    console.log(`  ${dim("No snapshots yet. Run 'project-doctor snapshot' to create one.")}`);
    blank();
    return;
  }

  console.log(`  ${bold("Project Health History")}`);
  blank();
  console.log(`  ${dim("Date          Checks")}`);
  console.log(`  ${dim("─────────────────────────")}`);

  for (const entry of history) {
    const checkStatus = entry.checks.failed === 0 ? green(ICONS.pass) : red(ICONS.fail);
    const checkText = `${entry.checks.passed}/${entry.checks.total}`;

    console.log(`  ${entry.date}    ${checkStatus} ${checkText}`);
  }

  // Show progress if multiple entries
  if (history.length >= 2) {
    const first = history[0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- history.length >= 2 guaranteed above
    const last = history.at(-1)!;
    const checkDiff = last.checks.failed - first.checks.failed;

    blank();
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

  blank();
}
