import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CheckResult } from "../types.js";
import { formatResult, printResults, printSummary, getSummary } from "./reporter.js";

function makeResult(overrides: Partial<CheckResult> = {}): CheckResult {
  return {
    name: "test-check",
    group: "test-group",
    status: "pass",
    message: "All good",
    ...overrides,
  };
}

describe("reporter", () => {
  describe("formatResult", () => {
    it("should format pass result with check icon, name, and message", () => {
      const result = makeResult({ name: "my-check", status: "pass", message: "Looks great" });
      const formatted = formatResult(result);
      expect(formatted).toContain("my-check");
      expect(formatted).toContain("Looks great");
    });

    it("should format fail result with name and message", () => {
      const result = makeResult({ name: "bad-check", status: "fail", message: "Something wrong" });
      const formatted = formatResult(result);
      expect(formatted).toContain("bad-check");
      expect(formatted).toContain("Something wrong");
    });

    it("should format skip result with name and message", () => {
      const result = makeResult({ name: "skip-check", status: "skip", message: "Skipped" });
      const formatted = formatResult(result);
      expect(formatted).toContain("skip-check");
      expect(formatted).toContain("Skipped");
    });

    it("should include check name and message in output", () => {
      const result = makeResult();
      const formatted = formatResult(result);
      expect(formatted).toContain("test-check");
      expect(formatted).toContain("All good");
    });
  });

  describe("getSummary", () => {
    it("should count pass/fail/skip correctly from mixed results", () => {
      const results: CheckResult[] = [
        makeResult({ name: "c1", status: "pass" }),
        makeResult({ name: "c2", status: "pass" }),
        makeResult({ name: "c3", status: "fail" }),
        makeResult({ name: "c4", status: "skip" }),
      ];

      const summary = getSummary(results);
      expect(summary).toEqual({ total: 4, passed: 2, failed: 1, skipped: 1 });
    });

    it("should return all zeros for empty results", () => {
      const summary = getSummary([]);
      expect(summary).toEqual({ total: 0, passed: 0, failed: 0, skipped: 0 });
    });

    it("should handle all-fail results", () => {
      const results = [
        makeResult({ name: "c1", status: "fail" }),
        makeResult({ name: "c2", status: "fail" }),
        makeResult({ name: "c3", status: "fail" }),
      ];
      const summary = getSummary(results);
      expect(summary).toEqual({ total: 3, passed: 0, failed: 3, skipped: 0 });
    });
  });

  describe("printSummary", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should log passed, failed counts, and total", () => {
      const results: CheckResult[] = [
        makeResult({ name: "c1", status: "pass" }),
        makeResult({ name: "c2", status: "fail" }),
        makeResult({ name: "c3", status: "skip" }),
      ];

      printSummary(results);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0].join(" ");
      expect(output).toContain("Summary:");
      expect(output).toContain("1 passed");
      expect(output).toContain("1 failed");
      expect(output).toContain("1 skipped");
      expect(output).toContain("3 total");
    });

    it("should omit zero-count sections", () => {
      const results: CheckResult[] = [
        makeResult({ name: "c1", status: "pass" }),
        makeResult({ name: "c2", status: "pass" }),
      ];

      printSummary(results);

      const output = consoleSpy.mock.calls[0].join(" ");
      expect(output).toContain("2 passed");
      expect(output).not.toContain("failed");
      expect(output).not.toContain("skipped");
    });
  });

  describe("printResults", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should skip all-pass groups in compact mode", () => {
      const results: CheckResult[] = [
        makeResult({ name: "good-check", group: "group-a", status: "pass" }),
        makeResult({ name: "bad-check", group: "group-b", status: "fail", message: "Bad" }),
      ];

      printResults(results);

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      // group-a has only passes — should not appear in compact mode
      expect(output).not.toContain("group-a");
      // group-b has a failure — should appear
      expect(output).toContain("group-b");
      expect(output).toContain("bad-check");
    });

    it("should only show failures (not passes) within a group in compact mode", () => {
      const results: CheckResult[] = [
        makeResult({ name: "pass-check", group: "grp", status: "pass", message: "OK" }),
        makeResult({ name: "fail-check", group: "grp", status: "fail", message: "BAD" }),
      ];

      printResults(results);

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      // Group header should appear because there's a failure
      expect(output).toContain("grp");
      // Should show the failing check
      expect(output).toContain("fail-check");
      expect(output).toContain("BAD");
      // Should NOT show the passing check in compact mode
      expect(output).not.toContain("pass-check");
    });

    it("should show all results (including passes) in fullReport mode", () => {
      const results: CheckResult[] = [
        makeResult({ name: "pass-check", group: "grp", status: "pass", message: "OK" }),
        makeResult({ name: "fail-check", group: "grp", status: "fail", message: "BAD" }),
      ];

      printResults(results, { fullReport: true });

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      expect(output).toContain("pass-check");
      expect(output).toContain("fail-check");
    });

    it("should show all groups in fullReport mode even if all pass", () => {
      const results: CheckResult[] = [
        makeResult({ name: "c1", group: "group-a", status: "pass" }),
        makeResult({ name: "c2", group: "group-b", status: "pass" }),
      ];

      printResults(results, { fullReport: true });

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      expect(output).toContain("group-a");
      expect(output).toContain("group-b");
    });

    it("should preserve group ordering from input", () => {
      const results: CheckResult[] = [
        makeResult({ name: "c1", group: "alpha", status: "fail", message: "Fail 1" }),
        makeResult({ name: "c2", group: "beta", status: "fail", message: "Fail 2" }),
        makeResult({ name: "c3", group: "alpha", status: "fail", message: "Fail 3" }),
      ];

      printResults(results);

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      // alpha should appear before beta (first seen order)
      const alphaPos = output.indexOf("alpha");
      const betaPos = output.indexOf("beta");
      expect(alphaPos).toBeLessThan(betaPos);
    });

    it("should include a summary at the end", () => {
      const results: CheckResult[] = [
        makeResult({ name: "c1", group: "grp", status: "fail", message: "Bad" }),
      ];

      printResults(results);

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      expect(output).toContain("Summary:");
      expect(output).toContain("1 total");
    });
  });
});
