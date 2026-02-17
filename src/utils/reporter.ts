import type { CheckResult, CheckStatus } from "../types.js";
import { green, red, dim, bold } from "./colors.js";

const STATUS_ICONS: Record<CheckStatus, string> = {
  pass: "\u2713",
  fail: "\u2717",
  skip: "\u2014",
};

const STATUS_FORMATTERS: Record<CheckStatus, (s: string) => string> = {
  pass: green,
  fail: red,
  skip: dim,
};

export function formatResult(result: CheckResult, useColor = true): string {
  const icon = STATUS_ICONS[result.status];
  const formatter = useColor ? STATUS_FORMATTERS[result.status] : (s: string) => s;

  return `${formatter(icon)} ${result.name}: ${result.message}`;
}

function groupResults(results: CheckResult[]): Map<string, CheckResult[]> {
  const grouped = new Map<string, CheckResult[]>();

  for (const result of results) {
    const existing = grouped.get(result.group) ?? [];
    existing.push(result);
    grouped.set(result.group, existing);
  }

  return grouped;
}

export interface PrintOptions {
  fullReport?: boolean;
}

export function printResults(results: CheckResult[], options: PrintOptions = {}): void {
  const useColor = process.stdout.isTTY ?? false;
  const grouped = groupResults(results);
  const { fullReport = false } = options;

  for (const [groupName, groupResults] of grouped) {
    const issues = groupResults.filter((r) => r.status === "fail");

    // In compact mode, skip groups with no issues
    if (!fullReport && issues.length === 0) {
      continue;
    }

    console.log(useColor ? bold(groupName) : groupName);

    const resultsToShow = fullReport ? groupResults : issues;
    for (const result of resultsToShow) {
      console.log(`  ${formatResult(result, useColor)}`);
    }

    console.log("");
  }

  printSummary(results);
}

export function printSummary(results: CheckResult[]): void {
  const summary = getSummary(results);
  const parts: string[] = [];

  if (summary.passed > 0) parts.push(green(`${summary.passed} passed`));
  if (summary.failed > 0) parts.push(red(`${summary.failed} failed`));
  if (summary.skipped > 0) parts.push(dim(`${summary.skipped} skipped`));

  console.log(`Summary: ${parts.join(", ")} (${summary.total} total)`);
}

export function getSummary(results: CheckResult[]): {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
} {
  return {
    total: results.length,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    skipped: results.filter((r) => r.status === "skip").length,
  };
}
