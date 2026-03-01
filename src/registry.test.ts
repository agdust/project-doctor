import { describe, it, expect } from "vitest";
import {
  checkGroups,
  getAllChecks,
  getChecksByGroup,
  listGroups,
  listChecks,
} from "./registry.js";

describe("registry", () => {
  const EXPECTED_GROUPS = [
    "package-json",
    "tsconfig",
    "gitignore",
    "git",
    "eslint",
    "prettier",
    "jscpd",
    "editorconfig",
    "node-version",
    "docs",
    "deps",
    "env",
    "bundle-size",
    "docker",
  ];

  describe("checkGroups", () => {
    it("should contain all expected groups", () => {
      const groupNames = checkGroups.map((g) => g.name);
      for (const name of EXPECTED_GROUPS) {
        expect(groupNames).toContain(name);
      }
    });

    it("should have the expected number of groups", () => {
      expect(checkGroups).toHaveLength(EXPECTED_GROUPS.length);
    });

    it("should have no duplicate group names", () => {
      const names = checkGroups.map((g) => g.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it("should have checks array for every group", () => {
      for (const group of checkGroups) {
        expect(Array.isArray(group.checks)).toBe(true);
        expect(group.checks.length).toBeGreaterThan(0);
      }
    });

    it("should have loadContext function for every group", () => {
      for (const group of checkGroups) {
        expect(typeof group.loadContext).toBe("function");
      }
    });
  });

  describe("check data consistency", () => {
    it("should have no duplicate check names across all groups", () => {
      const allNames: string[] = [];
      for (const group of checkGroups) {
        for (const check of group.checks) {
          allNames.push(check.name);
        }
      }
      const unique = new Set(allNames);
      expect(unique.size).toBe(allNames.length);
    });

    it("every check should have name, description, and tags", () => {
      for (const group of checkGroups) {
        for (const check of group.checks) {
          expect(check.name).toBeTruthy();
          expect(typeof check.name).toBe("string");
          expect(check.description).toBeTruthy();
          expect(typeof check.description).toBe("string");
          expect(Array.isArray(check.tags)).toBe(true);
          expect(check.tags.length).toBeGreaterThan(0);
        }
      }
    });

    it("every check should have a run function", () => {
      for (const group of checkGroups) {
        for (const check of group.checks) {
          expect(typeof check.run).toBe("function");
        }
      }
    });
  });

  describe("getAllChecks", () => {
    it("should return a flat array of all checks", () => {
      const allChecks = getAllChecks();
      expect(allChecks.length).toBeGreaterThan(0);

      // Sum of all group check counts should equal total
      const totalFromGroups = checkGroups.reduce((sum, g) => sum + g.checks.length, 0);
      expect(allChecks).toHaveLength(totalFromGroups);
    });
  });

  describe("getChecksByGroup", () => {
    it("should return checks for an existing group", () => {
      const checks = getChecksByGroup("package-json");
      expect(checks.length).toBeGreaterThan(0);
      // All returned checks should belong to that group
      const allNames = checkGroups
        .find((g) => g.name === "package-json")!
        .checks.map((c) => c.name);
      for (const check of checks) {
        expect(allNames).toContain(check.name);
      }
    });

    it("should return empty array for unknown group", () => {
      const checks = getChecksByGroup("nonexistent-group");
      expect(checks).toEqual([]);
    });
  });

  describe("listGroups", () => {
    it("should return all group names", () => {
      const groups = listGroups();
      expect(groups).toHaveLength(EXPECTED_GROUPS.length);
      for (const name of EXPECTED_GROUPS) {
        expect(groups).toContain(name);
      }
    });
  });

  describe("listChecks", () => {
    it("should return metadata for each check", () => {
      const checks = listChecks();
      expect(checks.length).toBeGreaterThan(0);

      for (const check of checks) {
        expect(check).toHaveProperty("group");
        expect(check).toHaveProperty("name");
        expect(check).toHaveProperty("description");
        expect(check).toHaveProperty("tags");
        expect(typeof check.group).toBe("string");
        expect(typeof check.name).toBe("string");
        expect(typeof check.description).toBe("string");
        expect(Array.isArray(check.tags)).toBe(true);
      }
    });

    it("should have same count as getAllChecks", () => {
      expect(listChecks()).toHaveLength(getAllChecks().length);
    });
  });
});
