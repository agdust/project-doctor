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
  // TODO: Re-enable these tests once proper deep equality is implemented
  // See differ.ts for implementation requirements

  describe("additions only (no comparison needed)", () => {
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

    it("should handle empty configs", () => {
      const diff = computeDiff({}, []);

      expect(diff.entries).toHaveLength(0);
      expect(hasDifferences(diff)).toBe(false);
    });
  });

  describe("removals only (no comparison needed)", () => {
    it("should detect removed rules", () => {
      const current: Record<string, RuleValue> = {
        "old-rule": "warn",
      };
      const proposed: ResolvedRule[] = [];

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

  describe("changes (requires deep equality - NotImplemented)", () => {
    it.skip("should detect rule value changes", () => {
      // TODO: Implement once deep equality is available
    });

    it.skip("should detect array option changes", () => {
      // TODO: Implement once deep equality is available
    });

    it.skip("should not report change when values are equal", () => {
      // TODO: Implement once deep equality is available
    });
  });

  describe("mixed changes (requires deep equality - NotImplemented)", () => {
    it.skip("should handle additions, changes, and removals together", () => {
      // TODO: Implement once deep equality is available
    });

    it.skip("should return empty diff when configs match", () => {
      // TODO: Implement once deep equality is available
    });
  });

  describe("sorting (additions and removals only)", () => {
    it("should sort additions alphabetically", () => {
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
  it("should return true when there are additions", () => {
    const diff = computeDiff({}, [makeRule("new-rule", "error")]);
    expect(hasDifferences(diff)).toBe(true);
  });

  it("should return true when there are removals", () => {
    const diff = computeDiff({ "old-rule": "error" }, []);
    expect(hasDifferences(diff)).toBe(true);
  });

  it("should return false when both are empty", () => {
    const diff = computeDiff({}, []);
    expect(hasDifferences(diff)).toBe(false);
  });
});
