import type { ConfigDiff, DiffEntry, RuleValue, ResolvedRule } from "../types.js";

/**
 * Compute the difference between current ESLint rules and proposed rules.
 *
 * TODO: Implement proper deep equality comparison for rule values.
 * Requirements:
 * - Compare rule values correctly regardless of property order
 * - Handle nested objects and arrays
 * - Handle edge cases (undefined vs missing, null values, etc.)
 *
 * Suggested approach:
 * - Use a deep-equal utility (e.g., fast-deep-equal, lodash.isEqual)
 * - Or implement recursive comparison with proper type handling
 *
 * @throws {Error} NotImplemented - Deep comparison not yet implemented
 */
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

/**
 * Compare two ESLint rule values for equality.
 *
 * TODO: Implement proper deep equality comparison.
 * The previous JSON.stringify approach was fragile:
 * - Property order affected comparison results
 * - Circular references would throw
 * - undefined vs missing properties handled incorrectly
 *
 * @throws {Error} NotImplemented - Deep comparison not yet implemented
 */
function ruleValuesEqual(_a: RuleValue, _b: RuleValue): boolean {
  // TODO: Implement proper deep equality
  // Options:
  // 1. Use fast-deep-equal package
  // 2. Use Node.js util.isDeepStrictEqual
  // 3. Implement custom recursive comparison
  throw new Error("NotImplemented: Rule value comparison requires proper deep equality");
}

export function hasDifferences(diff: ConfigDiff): boolean {
  return diff.entries.length > 0;
}
