import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { checkGroups } from "../registry.js";
import { createGlobalContext } from "../context/global.js";
import { checkDeps, type AuditResult } from "./deps-checker.js";
import type { CheckResultBase, GlobalContext } from "../types.js";

type SnapshotEntry = {
  date: string;
  checks: {
    total: number;
    passed: number;
    failed: number;
  };
  deps: {
    total: number;
    outdated: number;
  } | null;
  audit: AuditResult | null;
  failingChecks: string[];
};

const HISTORY_DIR = ".project-doctor";
const HISTORY_FILE = "history.json";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function loadHistory(projectPath: string): Promise<SnapshotEntry[]> {
  const historyPath = join(projectPath, HISTORY_DIR, HISTORY_FILE);
  try {
    const content = await readFile(historyPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveHistory(projectPath: string, history: SnapshotEntry[]): Promise<void> {
  const historyDir = join(projectPath, HISTORY_DIR);
  const historyPath = join(historyDir, HISTORY_FILE);

  await mkdir(historyDir, { recursive: true });
  await writeFile(historyPath, JSON.stringify(history, null, 2) + "\n", "utf-8");
}

export async function takeSnapshot(projectPath: string): Promise<SnapshotEntry> {
  const global = await createGlobalContext(projectPath);

  // Run all checks
  const checkResults: CheckResultBase[] = [];
  for (const group of checkGroups) {
    const groupContext = await group.loadContext(global);
    for (const check of group.checks) {
      const result = await (check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>)(
        global,
        groupContext
      );
      checkResults.push(result);
    }
  }

  // Check dependencies and audit
  let depsResult: SnapshotEntry["deps"] = null;
  let auditResult: AuditResult | null = null;
  try {
    const deps = await checkDeps({ projectPath });
    depsResult = {
      total: deps.outdated.length + deps.upToDate,
      outdated: deps.outdated.length,
    };
    auditResult = deps.audit;
  } catch {
    // No package.json or other error
  }

  const failingChecks = checkResults
    .filter((r) => r.status === "fail")
    .map((r) => r.name);

  return {
    date: getToday(),
    checks: {
      total: checkResults.length,
      passed: checkResults.filter((r) => r.status === "pass").length,
      failed: checkResults.filter((r) => r.status === "fail").length,
    },
    deps: depsResult,
    audit: auditResult,
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
  if (snapshot.deps) {
    console.log(`    ${snapshot.deps.outdated} outdated dependencies`);
  }
  if (snapshot.audit) {
    console.log(`    ${snapshot.audit.total} vulnerabilities`);
  }
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
  console.log("  \x1b[90mDate          Checks     Deps   Vulns\x1b[0m");
  console.log("  \x1b[90m───────────────────────────────────────────\x1b[0m");

  for (const entry of history) {
    const checkStatus = entry.checks.failed === 0
      ? "\x1b[32m✓\x1b[0m"
      : "\x1b[31m✗\x1b[0m";
    const checkText = `${entry.checks.passed}/${entry.checks.total}`;

    let depsText = "\x1b[90m-\x1b[0m";
    if (entry.deps) {
      depsText = entry.deps.outdated === 0
        ? "\x1b[32m✓\x1b[0m"
        : `\x1b[33m${entry.deps.outdated}\x1b[0m`;
    }

    let auditText = "\x1b[90m-\x1b[0m";
    if (entry.audit) {
      if (entry.audit.total === 0) {
        auditText = "\x1b[32m✓\x1b[0m";
      } else if (entry.audit.critical > 0 || entry.audit.high > 0) {
        auditText = `\x1b[31m${entry.audit.total}\x1b[0m`;
      } else {
        auditText = `\x1b[33m${entry.audit.total}\x1b[0m`;
      }
    }

    console.log(`  ${entry.date}    ${checkStatus} ${checkText.padEnd(8)} ${depsText.padEnd(6)} ${auditText}`);
  }

  // Show progress if multiple entries
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const checkDiff = last.checks.failed - first.checks.failed;

    console.log();
    if (checkDiff < 0) {
      console.log(`  \x1b[32m↑ Fixed ${Math.abs(checkDiff)} issue${Math.abs(checkDiff) > 1 ? "s" : ""} since ${first.date}\x1b[0m`);
    } else if (checkDiff > 0) {
      console.log(`  \x1b[31m↓ ${checkDiff} new issue${checkDiff > 1 ? "s" : ""} since ${first.date}\x1b[0m`);
    } else {
      console.log(`  \x1b[90m→ No change since ${first.date}\x1b[0m`);
    }
  }

  console.log();
}
