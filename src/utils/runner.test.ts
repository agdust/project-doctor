import { describe, it, expect } from "vitest";
import { fixtures } from "../test/fixtures.js";
import { runChecks } from "./runner.js";

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
});
