import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createGlobalContext } from "../context/global.js";
import { ensureConfigDir } from "../config/constants.js";
import { runAllChecksRaw } from "./runner.js";
import { safeJsonParse } from "./safe-json.js";

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

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function loadHistory(projectPath: string): Promise<SnapshotEntry[]> {
  const historyPath = join(projectPath, HISTORY_DIR, HISTORY_FILE);
  try {
    const content = await readFile(historyPath, "utf-8");
    return safeJsonParse<SnapshotEntry[]>(content) ?? [];
  } catch {
    // History file doesn't exist yet
    return [];
  }
}

async function saveHistory(projectPath: string, history: SnapshotEntry[]): Promise<void> {
  const historyPath = join(projectPath, HISTORY_DIR, HISTORY_FILE);

  await ensureConfigDir(projectPath);
  await writeFile(historyPath, JSON.stringify(history, null, 2) + "\n", "utf-8");
}

export async function takeSnapshot(projectPath: string): Promise<SnapshotEntry> {
  const global = await createGlobalContext(projectPath);

  // Run all checks
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
  console.log("  \x1b[90mTaking snapshot...\x1b[0m");

  const snapshot = await takeSnapshot(projectPath);
  const history = await loadHistory(projectPath);

  // Replace or append today's entry
  const existingIndex = history.findIndex((e) => e.date === snapshot.date);
  if (existingIndex >= 0) {
    history[existingIndex] = snapshot;
  } else {
    history.push(snapshot);
  }

  // Sort by date
  history.sort((a, b) => a.date.localeCompare(b.date));

  await saveHistory(projectPath, history);

  console.log();
  console.log(`  \x1b[32m✓\x1b[0m Snapshot saved for ${snapshot.date}`);
  console.log(`    ${snapshot.checks.passed}/${snapshot.checks.total} checks passing`);
  console.log();
  console.log(`  \x1b[90mSaved to ${HISTORY_DIR}/${HISTORY_FILE}\x1b[0m`);
  console.log();
}

export async function runHistory(projectPath: string): Promise<void> {
  const history = await loadHistory(projectPath);

  console.log();

  if (history.length === 0) {
    console.log("  \x1b[90mNo snapshots yet. Run 'project-doctor snapshot' to create one.\x1b[0m");
    console.log();
    return;
  }

  console.log("  \x1b[1mProject Health History\x1b[0m");
  console.log();
  console.log("  \x1b[90mDate          Checks\x1b[0m");
  console.log("  \x1b[90m─────────────────────────\x1b[0m");

  for (const entry of history) {
    const checkStatus = entry.checks.failed === 0 ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    const checkText = `${entry.checks.passed}/${entry.checks.total}`;

    console.log(`  ${entry.date}    ${checkStatus} ${checkText}`);
  }

  // Show progress if multiple entries
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const checkDiff = last.checks.failed - first.checks.failed;

    console.log();
    if (checkDiff < 0) {
      console.log(
        `  \x1b[32m↑ Fixed ${Math.abs(checkDiff)} issue${Math.abs(checkDiff) > 1 ? "s" : ""} since ${first.date}\x1b[0m`,
      );
    } else if (checkDiff > 0) {
      console.log(
        `  \x1b[31m↓ ${checkDiff} new issue${checkDiff > 1 ? "s" : ""} since ${first.date}\x1b[0m`,
      );
    } else {
      console.log(`  \x1b[90m→ No change since ${first.date}\x1b[0m`);
    }
  }

  console.log();
}
