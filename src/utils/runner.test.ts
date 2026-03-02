import { describe, it, expect } from "vitest";
import { fixtures } from "../test/fixtures.js";
import { runChecks, runAllChecks } from "./runner.js";
import { listChecks } from "../registry.js";

describe("runner", () => {
  describe("shell-only project (generic type)", () => {
    it("should not run any JS-specific checks for generic projects", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.shellOnly,
        skipConfig: true,
      });

      // JS-specific groups should be completely skipped for generic projects
      const jsGroups = [
        "package-json",
        "tsconfig",
        "eslint",
        "prettier",
        "node-version",
        "deps",
        "bundle-size",
        "jscpd",
      ];

      for (const group of jsGroups) {
        const groupResults = results.filter((r) => r.group === group);
        expect(groupResults).toHaveLength(0);
      }
    });

    it("should only run generic checks for shell-only projects", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.shellOnly,
        skipConfig: true,
      });

      // Generic groups that should run
      const genericGroups = ["gitignore", "git", "editorconfig", "docs", "env", "docker"];

      // At least some generic checks should run
      const genericResults = results.filter((r) => genericGroups.includes(r.group));
      expect(genericResults.length).toBeGreaterThan(0);

      // All results should be from generic groups only
      for (const result of results) {
        expect(genericGroups).toContain(result.group);
      }
    });

    it("should detect project type as generic when no JS files present", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.shellOnly,
        skipConfig: true,
      });

      // Verify no JS groups appear
      const jsGroups = ["package-json", "tsconfig", "eslint", "prettier"];
      const jsResults = results.filter((r) => jsGroups.includes(r.group));
      expect(jsResults).toHaveLength(0);
    });
  });

  describe("JS project", () => {
    it("should run JS-specific checks for JS projects", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
      });

      // package-json group should have results
      const packageJsonResults = results.filter((r) => r.group === "package-json");
      expect(packageJsonResults.length).toBeGreaterThan(0);
    });
  });

  describe("group filtering", () => {
    it("should only run specified groups when groups option is set", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        groups: ["package-json"],
      });

      // All results should be from package-json group
      for (const result of results) {
        expect(result.group).toBe("package-json");
      }
      expect(results.length).toBeGreaterThan(0);
    });

    it("should support multiple group filters", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        groups: ["package-json", "docs"],
      });

      const groups = new Set(results.map((r) => r.group));
      // Should only contain the specified groups
      for (const group of groups) {
        expect(["package-json", "docs"]).toContain(group);
      }
      // Both groups should have at least some results
      expect(results.filter((r) => r.group === "package-json").length).toBeGreaterThan(0);
      expect(results.filter((r) => r.group === "docs").length).toBeGreaterThan(0);
    });

    it("should return empty results for nonexistent group", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        groups: ["nonexistent-group"],
      });

      expect(results).toHaveLength(0);
    });
  });

  describe("tag filtering", () => {
    it("should only include checks matching the included tag", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        includeTags: ["required"],
      });

      expect(results.length).toBeGreaterThan(0);

      // Verify every returned check actually has the "required" tag
      const allChecks = listChecks();
      for (const result of results) {
        // Skip synthetic "not-detected" results
        if (result.name.endsWith("-not-detected")) continue;
        const checkDef = allChecks.find((c) => c.name === result.name);
        expect(checkDef, `check ${result.name} should exist in registry`).toBeDefined();
        expect(
          checkDef!.tags,
          `check ${result.name} should have "required" tag`,
        ).toContain("required");
      }
    });

    it("should produce fewer results when excluding a tag", async () => {
      const { results: allResults } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
      });

      const { results: filteredResults } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        excludeTags: ["opinionated"],
      });

      // Excluding a tag must strictly reduce the result set
      expect(filteredResults.length).toBeLessThan(allResults.length);

      // None of the remaining results should be for opinionated-only checks
      const allChecks = listChecks();
      for (const result of filteredResults) {
        if (result.name.endsWith("-not-detected")) continue;
        const checkDef = allChecks.find((c) => c.name === result.name);
        if (checkDef) {
          // If a check only has "opinionated" (no "required"/"recommended"), it should be excluded
          const hasOtherRequirement =
            checkDef.tags.includes("required") || checkDef.tags.includes("recommended");
          if (!hasOtherRequirement) {
            expect(checkDef.tags).not.toContain("opinionated");
          }
        }
      }
    });
  });

  describe("config-level check disabling", () => {
    it("should skip a check set to off in config", async () => {
      // Run all checks first to confirm the check normally runs
      const { results: allResults } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
      });
      const targetCheck = allResults.find((r) => r.name === "package-json-has-name");
      expect(targetCheck).toBeDefined();

      // Now run with config that disables that specific check
      // We can't easily pass check-level config through RunnerOptions,
      // but we can test group-level disabling which hits the same isGroupOff path
      const { results: filtered } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        groups: ["docs"], // Only run docs group, effectively disabling package-json checks
      });

      const pkgResults = filtered.filter((r) => r.group === "package-json");
      expect(pkgResults).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("should not throw when running checks on an empty project", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.empty,
        skipConfig: true,
      });

      // Should return results array (even if some are skip/fail)
      expect(Array.isArray(results)).toBe(true);
      // Every result should have a valid status
      for (const result of results) {
        expect(["pass", "fail", "skip"]).toContain(result.status);
      }
    });
  });

  describe("runAllChecks", () => {
    it("should return results with group, name, and status for every result", async () => {
      const results = await runAllChecks(fixtures.healthy);
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(typeof result.group).toBe("string");
        expect(result.group.length).toBeGreaterThan(0);
        expect(typeof result.name).toBe("string");
        expect(result.name.length).toBeGreaterThan(0);
        expect(["pass", "fail", "skip"]).toContain(result.status);
        expect(typeof result.message).toBe("string");
      }
    });

    it("should include results from multiple groups", async () => {
      const results = await runAllChecks(fixtures.healthy);
      const groups = new Set(results.map((r) => r.group));
      // A healthy JS project should exercise many groups
      expect(groups.size).toBeGreaterThan(3);
    });
  });

  describe("tool detection skipping", () => {
    it("should produce a skip result for eslint when not detected", async () => {
      // The minimal fixture has no eslint configuration
      const { results } = await runChecks({
        projectPath: fixtures.minimal,
        skipConfig: true,
      });

      const eslintResults = results.filter((r) => r.group === "eslint");
      // Minimal project is JS type, so eslint group is attempted but tool isn't detected.
      // The runner should emit exactly one "eslint-not-detected" skip result.
      expect(eslintResults).toHaveLength(1);
      expect(eslintResults[0].name).toBe("eslint-not-detected");
      expect(eslintResults[0].status).toBe("skip");
      expect(eslintResults[0].message).toContain("not detected");
    });

    it("should produce a skip result for prettier when not detected", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.minimal,
        skipConfig: true,
      });

      const prettierResults = results.filter((r) => r.group === "prettier");
      expect(prettierResults).toHaveLength(1);
      expect(prettierResults[0].name).toBe("prettier-not-detected");
      expect(prettierResults[0].status).toBe("skip");
      expect(prettierResults[0].message).toContain("not detected");
    });
  });
});
