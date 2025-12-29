import type { ConfigDiff, RuleValue } from "../types.js";

export function formatDiff(diff: ConfigDiff): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("\x1b[1mProposed Changes:\x1b[0m");
  lines.push("");

  if (diff.entries.length === 0) {
    lines.push("  \x1b[90mNo changes - configuration is up to date\x1b[0m");
    lines.push("");
    return lines.join("\n");
  }

  const added = diff.entries.filter((e) => e.action === "add");
  const changed = diff.entries.filter((e) => e.action === "change");
  const removed = diff.entries.filter((e) => e.action === "remove");

  if (added.length > 0) {
    lines.push("  \x1b[32mNew rules (+)\x1b[0m");
    for (const entry of added.slice(0, 20)) {
      lines.push(`    \x1b[32m+\x1b[0m ${entry.rule}: ${formatValue(entry.proposed)}`);
    }
    if (added.length > 20) {
      lines.push(`    \x1b[90m... and ${added.length - 20} more\x1b[0m`);
    }
    lines.push("");
  }

  if (changed.length > 0) {
    lines.push("  \x1b[33mChanged rules (~)\x1b[0m");
    for (const entry of changed.slice(0, 10)) {
      lines.push(`    \x1b[33m~\x1b[0m ${entry.rule}`);
      lines.push(`        \x1b[31m- ${formatValue(entry.current)}\x1b[0m`);
      lines.push(`        \x1b[32m+ ${formatValue(entry.proposed)}\x1b[0m`);
    }
    if (changed.length > 10) {
      lines.push(`    \x1b[90m... and ${changed.length - 10} more\x1b[0m`);
    }
    lines.push("");
  }

  if (removed.length > 0) {
    lines.push("  \x1b[31mRemoved rules (-)\x1b[0m");
    for (const entry of removed.slice(0, 10)) {
      lines.push(`    \x1b[31m-\x1b[0m ${entry.rule}`);
    }
    if (removed.length > 10) {
      lines.push(`    \x1b[90m... and ${removed.length - 10} more\x1b[0m`);
    }
    lines.push("");
  }

  lines.push("\x1b[90m  ─────────────────────────────────────────\x1b[0m");
  lines.push("");
  lines.push("  \x1b[1mSummary\x1b[0m");
  lines.push(`    \x1b[32m+${diff.summary.added}\x1b[0m added`);
  lines.push(`    \x1b[33m~${diff.summary.changed}\x1b[0m changed`);
  lines.push(`    \x1b[31m-${diff.summary.removed}\x1b[0m removed`);
  lines.push("");

  return lines.join("\n");
}

function formatValue(value: RuleValue | undefined): string {
  if (value === undefined) return "(not set)";
  if (typeof value === "string") return `"${value}"`;
  return JSON.stringify(value);
}
