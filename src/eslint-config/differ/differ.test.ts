import { describe, it, expect } from "vitest";
import { computeDiff, hasDifferences } from "./differ.js";
import type { ResolvedRule, RuleValue } from "../types.js";

function makeRule(name: string, value: RuleValue): ResolvedRule {
  return {
    name,
    value,
    comment: `Test comment for ${name}`,
    source: "base",
  };
}

describe("computeDiff", () => {
  describe("no differences", () => {
    it("should return empty diff when configs match", () => {
      const current: Record<string, RuleValue> = {
        "no-console": "error",
        eqeqeq: "error",
      };
      const proposed: ResolvedRule[] = [
        makeRule("no-console", "error"),
        makeRule("eqeqeq", "error"),
      ];

      const diff = computeDiff(current, proposed);

      expect(diff.entries).toHaveLength(0);
      expect(diff.summary.added).toBe(0);
      expect(diff.summary.changed).toBe(0);
      expect(diff.summary.removed).toBe(0);
    });

    it("should handle empty configs", () => {
      const diff = computeDiff({}, []);

      expect(diff.entries).toHaveLength(0);
      expect(hasDifferences(diff)).toBe(false);
    });
  });

  describe("additions", () => {
    it("should detect new rules", () => {
      const current: Record<string, RuleValue> = {};
      const proposed: ResolvedRule[] = [makeRule("no-console", "error")];

      const diff = computeDiff(current, proposed);

      expect(diff.entries).toHaveLength(1);
      expect(diff.entries[0]).toMatchObject({
        rule: "no-console",
        current: undefined,
        proposed: "error",
        action: "add",
      });
      expect(diff.summary.added).toBe(1);
    });

    it("should detect multiple additions", () => {
      const current: Record<string, RuleValue> = {};
      const proposed: ResolvedRule[] = [
        makeRule("no-console", "error"),
        makeRule("eqeqeq", "warn"),
        makeRule("no-var", "error"),
      ];

      const diff = computeDiff(current, proposed);

      expect(diff.summary.added).toBe(3);
      expect(diff.entries.every((e) => e.action === "add")).toBe(true);
    });
  });

  describe("changes", () => {
    it("should detect rule value changes", () => {
      const current: Record<string, RuleValue> = {
        "no-console": "warn",
      };
      const proposed: ResolvedRule[] = [makeRule("no-console", "error")];

      const diff = computeDiff(current, proposed);

      expect(diff.entries).toHaveLength(1);
      expect(diff.entries[0]).toMatchObject({
        rule: "no-console",
        current: "warn",
        proposed: "error",
        action: "change",
      });
      expect(diff.summary.changed).toBe(1);
    });

    it("should detect array option changes", () => {
      const current: Record<string, RuleValue> = {
        "max-len": ["error", { max: 80 }],
      };
      const proposed: ResolvedRule[] = [makeRule("max-len", ["error", { max: 120 }])];

      const diff = computeDiff(current, proposed);

      expect(diff.summary.changed).toBe(1);
      expect(diff.entries[0]?.action).toBe("change");
    });

    it("should not report change when values are equal", () => {
      const current: Record<string, RuleValue> = {
        "max-len": ["error", { max: 100 }],
      };
      const proposed: ResolvedRule[] = [makeRule("max-len", ["error", { max: 100 }])];

      const diff = computeDiff(current, proposed);

      expect(diff.entries).toHaveLength(0);
    });
  });

  describe("removals", () => {
    it("should detect removed rules", () => {
      const current: Record<string, RuleValue> = {
        "no-console": "error",
        "old-rule": "warn",
      };
      const proposed: ResolvedRule[] = [makeRule("no-console", "error")];

      const diff = computeDiff(current, proposed);

      expect(diff.entries).toHaveLength(1);
      expect(diff.entries[0]).toMatchObject({
        rule: "old-rule",
        current: "warn",
        proposed: "off",
        action: "remove",
      });
      expect(diff.summary.removed).toBe(1);
    });

    it("should detect multiple removals", () => {
      const current: Record<string, RuleValue> = {
        "rule-1": "error",
        "rule-2": "warn",
        "rule-3": "error",
      };
      const proposed: ResolvedRule[] = [];

      const diff = computeDiff(current, proposed);

      expect(diff.summary.removed).toBe(3);
      expect(diff.entries.every((e) => e.action === "remove")).toBe(true);
    });
  });

  describe("mixed changes", () => {
    it("should handle additions, changes, and removals together", () => {
      const current: Record<string, RuleValue> = {
        "existing-rule": "warn",
        "removed-rule": "error",
      };
      const proposed: ResolvedRule[] = [
        makeRule("existing-rule", "error"), // changed
        makeRule("new-rule", "error"), // added
      ];

      const diff = computeDiff(current, proposed);

      expect(diff.summary.added).toBe(1);
      expect(diff.summary.changed).toBe(1);
      expect(diff.summary.removed).toBe(1);
      expect(diff.entries).toHaveLength(3);
    });
  });

  describe("sorting", () => {
    it("should sort by action: add, change, remove", () => {
      const current: Record<string, RuleValue> = {
        "change-rule": "warn",
        "remove-rule": "error",
      };
      const proposed: ResolvedRule[] = [
        makeRule("add-rule", "error"),
        makeRule("change-rule", "error"),
      ];

      const diff = computeDiff(current, proposed);

      expect(diff.entries[0]?.action).toBe("add");
      expect(diff.entries[1]?.action).toBe("change");
      expect(diff.entries[2]?.action).toBe("remove");
    });

    it("should sort alphabetically within same action", () => {
      const current: Record<string, RuleValue> = {};
      const proposed: ResolvedRule[] = [
        makeRule("z-rule", "error"),
        makeRule("a-rule", "error"),
        makeRule("m-rule", "error"),
      ];

      const diff = computeDiff(current, proposed);

      expect(diff.entries[0]?.rule).toBe("a-rule");
      expect(diff.entries[1]?.rule).toBe("m-rule");
      expect(diff.entries[2]?.rule).toBe("z-rule");
    });
  });
});

describe("hasDifferences", () => {
  it("should return true when there are differences", () => {
    const diff = computeDiff({}, [makeRule("new-rule", "error")]);
    expect(hasDifferences(diff)).toBe(true);
  });

  it("should return false when there are no differences", () => {
    const diff = computeDiff({ "rule-1": "error" }, [makeRule("rule-1", "error")]);
    expect(hasDifferences(diff)).toBe(false);
  });
});
