/**
 * Check command - Run checks with JSON output support
 *
 * Usage:
 *   project-doctor check [options] [path]
 *
 * Options:
 *   --format <format>   Output format: text (default), json
 */

import type { CheckResult, CheckTag } from "../types.js";
import type { ResolvedConfig } from "../config/types.js";
import { buildFixableMap, buildTagsMap, countMutedChecks } from "../utils/checks.js";

export interface CheckJsonOutput {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    muted: number;
  };
  results: {
    name: string;
    group: string;
    status: "pass" | "fail" | "skip";
    message: string;
    tags: CheckTag[];
    fixable: boolean;
  }[];
}

export function formatCheckResultsAsJson(
  results: CheckResult[],
  config?: ResolvedConfig,
): CheckJsonOutput {
  const fixableMap = buildFixableMap();
  const tagsMap = buildTagsMap();

  return {
    summary: {
      total: results.length,
      passed: results.filter((r) => r.status === "pass").length,
      failed: results.filter((r) => r.status === "fail").length,
      skipped: results.filter((r) => r.status === "skip").length,
      muted: config ? countMutedChecks(config) : 0,
    },
    results: results.map((r) => ({
      name: r.name,
      group: r.group,
      status: r.status,
      message: r.message,
      tags: tagsMap.get(r.name) ?? [],
      fixable: fixableMap.get(r.name) ?? false,
    })),
  };
}

export function printCheckResultsAsJson(results: CheckResult[], config?: ResolvedConfig): void {
  const output = formatCheckResultsAsJson(results, config);
  console.log(JSON.stringify(output, null, 2));
}
