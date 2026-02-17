/**
 * List command - List all available checks
 *
 * Usage:
 *   project-doctor list [options] [path]
 *
 * Options:
 *   -g, --group <name>     Filter by group (repeatable)
 *   -t, --tag <tag>        Filter by tag (repeatable)
 *   --status <status>      Filter by status: all, enabled, disabled, muted
 *   --format <format>      Output format: table (default), json, names
 */

import { loadAndResolveConfig } from "../config/loader.js";
import { listChecks } from "../registry.js";
import { getCheckStatus, buildFixableMap, type CheckStatus } from "../utils/checks.js";
import { bold, dim, green, yellow } from "../utils/colors.js";

export interface ListOptions {
  groups?: string[];
  tags?: string[];
  status?: "all" | "enabled" | "disabled" | "muted";
  format?: "table" | "json" | "names";
}

interface CheckListInfo {
  name: string;
  group: string;
  description: string;
  tags: string[];
  status: CheckStatus;
  mutedUntil?: string;
  fixable: boolean;
}

function formatStatus(status: CheckStatus, mutedUntil?: string): string {
  switch (status) {
    case "enabled":
      return green("enabled");
    case "disabled":
      return dim("disabled");
    case "muted":
      return yellow(`muted${mutedUntil ? ` (until ${mutedUntil})` : ""}`);
  }
}

function formatTags(tags: string[]): string {
  return tags.map((t) => dim(t)).join(", ");
}

/**
 * List all available checks with their status.
 *
 * Supports filtering by group, tag, and status.
 * Output formats: table (default), json, names.
 *
 * @param projectPath - Absolute path to the project directory
 * @param options - Filter and format options
 */
export async function runList(projectPath: string, options: ListOptions): Promise<void> {
  const config = await loadAndResolveConfig(projectPath);
  const allChecks = listChecks();
  const fixableMap = buildFixableMap();

  // Build check info array
  let checks: CheckListInfo[] = allChecks.map((check) => {
    const statusInfo = getCheckStatus(check.name, check.tags, check.group, config);
    return {
      name: check.name,
      group: check.group,
      description: check.description,
      tags: check.tags,
      status: statusInfo.status,
      mutedUntil: statusInfo.mutedUntil,
      fixable: fixableMap.get(check.name) ?? false,
    };
  });

  // Apply filters
  if (options.groups && options.groups.length > 0) {
    const groupSet = new Set(options.groups);
    checks = checks.filter((c) => groupSet.has(c.group));
  }

  if (options.tags && options.tags.length > 0) {
    const tagSet = new Set(options.tags);
    checks = checks.filter((c) => c.tags.some((t) => tagSet.has(t)));
  }

  if (options.status && options.status !== "all") {
    checks = checks.filter((c) => c.status === options.status);
  }

  // Output based on format
  const format = options.format ?? "table";

  if (format === "json") {
    console.log(JSON.stringify(checks, null, 2));
    return;
  }

  if (format === "names") {
    for (const check of checks) {
      console.log(check.name);
    }
    return;
  }

  // Table format
  if (checks.length === 0) {
    console.log("No checks found matching the criteria.");
    return;
  }

  // Calculate column widths
  const nameWidth = Math.max(10, ...checks.map((c) => c.name.length));
  const groupWidth = Math.max(5, ...checks.map((c) => c.group.length));

  // Print header
  console.log();
  console.log(
    `${bold("Check Name".padEnd(nameWidth))}  ` +
      `${bold("Group".padEnd(groupWidth))}  ` +
      `${bold("Tags")}`,
  );
  console.log("─".repeat(nameWidth + groupWidth + 60));

  // Print rows
  for (const check of checks) {
    const statusStr = formatStatus(check.status, check.mutedUntil);
    const tagsStr = formatTags(check.tags);
    const fixableStr = check.fixable ? green("[fixable]") : "";

    console.log(
      `${check.name.padEnd(nameWidth)}  ` + `${check.group.padEnd(groupWidth)}  ` + tagsStr,
    );
    console.log(
      `${"".padEnd(nameWidth)}  ` +
        `${"".padEnd(groupWidth)}  ` +
        `Status: ${statusStr} ${fixableStr}`,
    );
  }

  console.log();
  console.log(`Total: ${checks.length} checks`);
}
