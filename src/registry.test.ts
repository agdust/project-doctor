import { describe, it, expect } from "vitest";
import { checkGroups, manualChecks, getAllChecks, listGroups, listChecks } from "./registry.js";

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

    it("should have a non-empty checks array for every group", () => {
      for (const group of checkGroups) {
        expect(Array.isArray(group.checks)).toBe(true);
        expect(
          group.checks.length,
          `group "${group.name}" should have at least one check`,
        ).toBeGreaterThan(0);
      }
    });

    it("should have a loadContext function for every group", () => {
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

    it("every check should have a non-empty name, description, and at least one tag", () => {
      for (const group of checkGroups) {
        for (const check of group.checks) {
          expect(check.name.length, `check in ${group.name} has empty name`).toBeGreaterThan(0);
          expect(
            check.description.length,
            `check "${check.name}" has empty description`,
          ).toBeGreaterThan(0);
          expect(check.tags.length, `check "${check.name}" has no tags`).toBeGreaterThan(0);
        }
      }
    });

    it("every check should have a run function", () => {
      for (const group of checkGroups) {
        for (const check of group.checks) {
          expect(typeof check.run, `check "${check.name}" missing run()`).toBe("function");
        }
      }
    });

    it("every check with a fix should have a fix description", () => {
      for (const group of checkGroups) {
        for (const check of group.checks) {
          if (check.fix) {
            expect(
              check.fix.description,
              `check "${check.name}" has fix without description`,
            ).toBeTruthy();
          }
        }
      }
    });
  });

  describe("manualChecks", () => {
    it("should be a non-empty array", () => {
      expect(Array.isArray(manualChecks)).toBe(true);
      expect(manualChecks.length).toBeGreaterThan(0);
    });

    it("every manual check should have name, description, details, and tags", () => {
      for (const check of manualChecks) {
        expect(check.name).toBeTruthy();
        expect(check.description).toBeTruthy();
        expect(check.details).toBeTruthy();
        expect(Array.isArray(check.tags)).toBe(true);
        expect(check.tags.length).toBeGreaterThan(0);
      }
    });

    it("should not overlap with automated check names", () => {
      const automatedNames = new Set(getAllChecks().map((c) => c.name));
      for (const manual of manualChecks) {
        expect(
          automatedNames.has(manual.name),
          `manual check "${manual.name}" conflicts with an automated check`,
        ).toBe(false);
      }
    });
  });

  describe("getAllChecks", () => {
    it("should return a flat array whose length matches the sum of all group check counts", () => {
      const allChecks = getAllChecks();
      const totalFromGroups = checkGroups.reduce((sum, g) => sum + g.checks.length, 0);
      expect(allChecks).toHaveLength(totalFromGroups);
    });

    it("should contain checks from every group", () => {
      const allChecks = getAllChecks();
      const checkNames = new Set(allChecks.map((c) => c.name));

      for (const group of checkGroups) {
        for (const check of group.checks) {
          expect(
            checkNames.has(check.name),
            `getAllChecks missing "${check.name}" from group "${group.name}"`,
          ).toBe(true);
        }
      }
    });
  });

  describe("listGroups", () => {
    it("should return all group names matching EXPECTED_GROUPS", () => {
      const groups = listGroups();
      expect(groups).toHaveLength(EXPECTED_GROUPS.length);
      for (const name of EXPECTED_GROUPS) {
        expect(groups).toContain(name);
      }
    });
  });

  describe("listChecks", () => {
    it("should return metadata for each check with group, name, description, tags", () => {
      const checks = listChecks();
      expect(checks.length).toBeGreaterThan(0);

      for (const check of checks) {
        expect(typeof check.group).toBe("string");
        expect(check.group.length).toBeGreaterThan(0);
        expect(typeof check.name).toBe("string");
        expect(check.name.length).toBeGreaterThan(0);
        expect(typeof check.description).toBe("string");
        expect(check.description.length).toBeGreaterThan(0);
        expect(Array.isArray(check.tags)).toBe(true);
        expect(check.tags.length).toBeGreaterThan(0);
      }
    });

    it("should have same count as getAllChecks", () => {
      expect(listChecks()).toHaveLength(getAllChecks().length);
    });

    it("should include checks from every group", () => {
      const checks = listChecks();
      const groupsInOutput = new Set(checks.map((c) => c.group));
      for (const name of EXPECTED_GROUPS) {
        expect(groupsInOutput.has(name), `listChecks() missing checks from group "${name}"`).toBe(
          true,
        );
      }
    });
  });
});
