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
    it("should include check icon for pass", () => {
      const result = makeResult({ status: "pass" });
      const formatted = formatResult(result, false);
      expect(formatted).toContain("\u2713");
      expect(formatted).toContain("test-check");
      expect(formatted).toContain("All good");
    });

    it("should include X icon for fail", () => {
      const result = makeResult({ status: "fail", message: "Something wrong" });
      const formatted = formatResult(result, false);
      expect(formatted).toContain("\u2717");
      expect(formatted).toContain("Something wrong");
    });

    it("should include dash icon for skip", () => {
      const result = makeResult({ status: "skip", message: "Skipped" });
      const formatted = formatResult(result, false);
      expect(formatted).toContain("\u2014");
      expect(formatted).toContain("Skipped");
    });

    it("should format without color when useColor is false", () => {
      const result = makeResult();
      const formatted = formatResult(result, false);
      // No ANSI escape codes
      expect(formatted).not.toMatch(/\u001b\[/);
    });
  });

  describe("getSummary", () => {
    it("should count pass/fail/skip correctly", () => {
      const results: CheckResult[] = [
        makeResult({ status: "pass" }),
        makeResult({ name: "check-2", status: "pass" }),
        makeResult({ name: "check-3", status: "fail" }),
        makeResult({ name: "check-4", status: "skip" }),
      ];

      const summary = getSummary(results);
      expect(summary.total).toBe(4);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);
    });

    it("should handle empty results", () => {
      const summary = getSummary([]);
      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.skipped).toBe(0);
    });

    it("should handle all same status", () => {
      const results = [
        makeResult({ status: "fail" }),
        makeResult({ name: "c2", status: "fail" }),
      ];
      const summary = getSummary(results);
      expect(summary.total).toBe(2);
      expect(summary.failed).toBe(2);
      expect(summary.passed).toBe(0);
      expect(summary.skipped).toBe(0);
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

    it("should log summary line", () => {
      const results: CheckResult[] = [
        makeResult({ status: "pass" }),
        makeResult({ name: "c2", status: "fail" }),
      ];

      printSummary(results);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(output).toContain("Summary:");
      expect(output).toContain("2 total");
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
        makeResult({ group: "group-a", status: "pass" }),
        makeResult({ name: "c2", group: "group-b", status: "fail", message: "Bad" }),
      ];

      printResults(results);

      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      // group-a is all-pass, should not appear in compact mode
      expect(output).not.toContain("group-a");
      // group-b has a failure, should appear
      expect(output).toContain("group-b");
    });

    it("should show all groups in fullReport mode", () => {
      const results: CheckResult[] = [
        makeResult({ group: "group-a", status: "pass" }),
        makeResult({ name: "c2", group: "group-b", status: "fail", message: "Bad" }),
      ];

      printResults(results, { fullReport: true });

      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(output).toContain("group-a");
      expect(output).toContain("group-b");
    });

    it("should group results by group name", () => {
      const results: CheckResult[] = [
        makeResult({ name: "c1", group: "alpha", status: "fail", message: "Fail 1" }),
        makeResult({ name: "c2", group: "beta", status: "fail", message: "Fail 2" }),
        makeResult({ name: "c3", group: "alpha", status: "fail", message: "Fail 3" }),
      ];

      printResults(results);

      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(output).toContain("alpha");
      expect(output).toContain("beta");
    });
  });
});
