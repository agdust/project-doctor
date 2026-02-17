import { bold, dim, green, yellow, red } from "../../utils/colors.js";
import type { ConfigDiff, RuleValue } from "../types.js";

export function formatDiff(diff: ConfigDiff): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(bold("Proposed Changes:"));
  lines.push("");

  if (diff.entries.length === 0) {
    lines.push(`  ${dim("No changes - configuration is up to date")}`);
    lines.push("");
    return lines.join("\n");
  }

  const added = diff.entries.filter((e) => e.action === "add");
  const changed = diff.entries.filter((e) => e.action === "change");
  const removed = diff.entries.filter((e) => e.action === "remove");

  if (added.length > 0) {
    lines.push(`  ${green("New rules (+)")}`);
    for (const entry of added.slice(0, 20)) {
      lines.push(`    ${green("+")} ${entry.rule}: ${formatValue(entry.proposed)}`);
    }
    if (added.length > 20) {
      lines.push(`    ${dim(`... and ${added.length - 20} more`)}`);
    }
    lines.push("");
  }

  if (changed.length > 0) {
    lines.push(`  ${yellow("Changed rules (~)")}`);
    for (const entry of changed.slice(0, 10)) {
      lines.push(`    ${yellow("~")} ${entry.rule}`);
      lines.push(`        ${red(`- ${formatValue(entry.current)}`)}`);
      lines.push(`        ${green(`+ ${formatValue(entry.proposed)}`)}`);
    }
    if (changed.length > 10) {
      lines.push(`    ${dim(`... and ${changed.length - 10} more`)}`);
    }
    lines.push("");
  }

  if (removed.length > 0) {
    lines.push(`  ${red("Removed rules (-)")}`);
    for (const entry of removed.slice(0, 10)) {
      lines.push(`    ${red("-")} ${entry.rule}`);
    }
    if (removed.length > 10) {
      lines.push(`    ${dim(`... and ${removed.length - 10} more`)}`);
    }
    lines.push("");
  }

  lines.push(dim("  ─────────────────────────────────────────"));
  lines.push("");
  lines.push(`  ${bold("Summary")}`);
  lines.push(`    ${green(`+${diff.summary.added}`)} added`);
  lines.push(`    ${yellow(`~${diff.summary.changed}`)} changed`);
  lines.push(`    ${red(`-${diff.summary.removed}`)} removed`);
  lines.push("");

  return lines.join("\n");
}

function formatValue(value: RuleValue | undefined): string {
  if (value === undefined) return "(not set)";
  if (typeof value === "string") return `"${value}"`;
  return JSON.stringify(value);
}
