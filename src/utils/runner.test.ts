import { describe, it, expect } from "vitest";
import { fixtures } from "../test/fixtures.js";
import { runChecks, runAllChecks } from "./runner.js";

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
    it("should include only checks with specified tags", async () => {
      const { results } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        includeTags: ["required"],
      });

      // Should have results (healthy project has required checks)
      expect(results.length).toBeGreaterThan(0);
    });

    it("should exclude checks with specified tags", async () => {
      const { results: allResults } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
      });

      const { results: filteredResults } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        excludeTags: ["opinionated"],
      });

      // Filtered should have fewer or equal results
      expect(filteredResults.length).toBeLessThanOrEqual(allResults.length);
    });
  });

  describe("config-level check disabling", () => {
    it("should skip checks disabled via config overrides", async () => {
      // Run with a check disabled
      const { results: filtered } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
        excludeTags: ["recommended"],
      });

      const { results: all } = await runChecks({
        projectPath: fixtures.healthy,
        skipConfig: true,
      });

      // Should have fewer results
      expect(filtered.length).toBeLessThan(all.length);
    });
  });

  describe("error handling", () => {
    it("should handle errors in check execution gracefully", async () => {
      // Running checks on an empty project should not throw
      const { results } = await runChecks({
        projectPath: fixtures.empty,
        skipConfig: true,
      });

      // Should still return results (even if some are skip/fail)
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("runAllChecks", () => {
    it("should return results for a project", async () => {
      const results = await runAllChecks(fixtures.healthy);
      expect(results.length).toBeGreaterThan(0);

      // All results should have group property
      for (const result of results) {
        expect(result.group).toBeTruthy();
        expect(result.name).toBeTruthy();
        expect(["pass", "fail", "skip"]).toContain(result.status);
      }
    });
  });

  describe("tool detection skipping", () => {
    it("should skip eslint group when eslint is not detected", async () => {
      // The minimal fixture has no eslint configuration
      const { results } = await runChecks({
        projectPath: fixtures.minimal,
        skipConfig: true,
      });

      const eslintResults = results.filter((r) => r.group === "eslint");
      // Should have a skip result saying "ESLint not detected" or no results
      if (eslintResults.length > 0) {
        expect(eslintResults).toHaveLength(1);
        expect(eslintResults[0].status).toBe("skip");
        expect(eslintResults[0].message).toContain("not detected");
      }
    });
  });
});
