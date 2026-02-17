import type { ConfigDiff, DiffEntry, RuleValue, ResolvedRule } from "../types.js";

export function computeDiff(
  current: Record<string, RuleValue>,
  proposed: ResolvedRule[],
): ConfigDiff {
  const entries: DiffEntry[] = [];
  const proposedMap = new Map(proposed.map((r) => [r.name, r.value]));

  // Find additions and changes
  for (const rule of proposed) {
    const currentValue = current[rule.name];
    if (currentValue === undefined) {
      entries.push({
        rule: rule.name,
        current: undefined,
        proposed: rule.value,
        action: "add",
      });
    } else if (!ruleValuesEqual(currentValue, rule.value)) {
      entries.push({
        rule: rule.name,
        current: currentValue,
        proposed: rule.value,
        action: "change",
      });
    }
  }

  // Find removals (rules in current that aren't in proposed)
  for (const [rule, value] of Object.entries(current)) {
    if (!proposedMap.has(rule)) {
      entries.push({
        rule,
        current: value,
        proposed: "off",
        action: "remove",
      });
    }
  }

  // Sort by action, then by rule name
  entries.sort((a, b) => {
    const actionOrder = { add: 0, change: 1, remove: 2 };
    if (a.action !== b.action) {
      return actionOrder[a.action] - actionOrder[b.action];
    }
    return a.rule.localeCompare(b.rule);
  });

  return {
    entries,
    summary: {
      added: entries.filter((e) => e.action === "add").length,
      changed: entries.filter((e) => e.action === "change").length,
      removed: entries.filter((e) => e.action === "remove").length,
    },
  };
}

// TODO: Replace JSON.stringify comparison with proper deep equality.
// Current approach is fragile: property order matters, and circular refs would throw.
// Consider using a deep-equal utility or structuredClone for comparison.
function ruleValuesEqual(a: RuleValue, b: RuleValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function hasDifferences(diff: ConfigDiff): boolean {
  return diff.entries.length > 0;
}
