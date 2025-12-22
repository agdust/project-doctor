import type { CheckResult, CheckStatus } from "../types.js";

const STATUS_ICONS: Record<CheckStatus, string> = {
  pass: "\u2713",
  fail: "\u2717",
  warn: "\u26a0",
  skip: "\u2014",
};

const STATUS_COLORS: Record<CheckStatus, string> = {
  pass: "\x1b[32m",
  fail: "\x1b[31m",
  warn: "\x1b[33m",
  skip: "\x1b[90m",
};

const RESET = "\x1b[0m";

export function formatResult(result: CheckResult, useColor = true): string {
  const icon = STATUS_ICONS[result.status];
  const color = useColor ? STATUS_COLORS[result.status] : "";
  const reset = useColor ? RESET : "";

  return `${color}${icon}${reset} ${result.name}: ${result.message}`;
}

export function printResults(results: CheckResult[]): void {
  const useColor = process.stdout.isTTY ?? false;

  for (const result of results) {
    console.log(formatResult(result, useColor));
  }

  console.log("");
  printSummary(results);
}

export function printSummary(results: CheckResult[]): void {
  const summary = getSummary(results);
  const parts: string[] = [];

  if (summary.passed > 0) parts.push(`\x1b[32m${summary.passed} passed\x1b[0m`);
  if (summary.failed > 0) parts.push(`\x1b[31m${summary.failed} failed\x1b[0m`);
  if (summary.warnings > 0) parts.push(`\x1b[33m${summary.warnings} warnings\x1b[0m`);
  if (summary.skipped > 0) parts.push(`\x1b[90m${summary.skipped} skipped\x1b[0m`);

  console.log(`Summary: ${parts.join(", ")} (${summary.total} total)`);
}

export function getSummary(results: CheckResult[]): {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
} {
  return {
    total: results.length,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    warnings: results.filter((r) => r.status === "warn").length,
    skipped: results.filter((r) => r.status === "skip").length,
  };
}
