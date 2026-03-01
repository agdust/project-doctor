import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TAG } from "../types.js";
import type { CheckTag } from "../types.js";
import type { ResolvedConfig } from "../config/types.js";
import { DEFAULT_CONFIG } from "../config/types.js";
import {
  isGroupForProjectType,
  getFixPriority,
  getCheckStatus,
  getValidCheckNames,
  getValidGroupNames,
  getValidTagNames,
  findCheck,
  isFixWithOptions,
  countMutedChecks,
  buildFixableMap,
  buildTagsMap,
  JS_GROUPS,
} from "./checks.js";

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe("checks utilities", () => {
  describe("isGroupForProjectType", () => {
    it("should return true for all groups when projectType is 'js'", () => {
      expect(isGroupForProjectType("package-json", "js")).toBe(true);
      expect(isGroupForProjectType("tsconfig", "js")).toBe(true);
      expect(isGroupForProjectType("gitignore", "js")).toBe(true);
      expect(isGroupForProjectType("docs", "js")).toBe(true);
    });

    it("should return false for JS groups when projectType is 'generic'", () => {
      for (const group of JS_GROUPS) {
        expect(isGroupForProjectType(group, "generic")).toBe(false);
      }
    });

    it("should return true for non-JS groups when projectType is 'generic'", () => {
      expect(isGroupForProjectType("gitignore", "generic")).toBe(true);
      expect(isGroupForProjectType("git", "generic")).toBe(true);
      expect(isGroupForProjectType("docs", "generic")).toBe(true);
      expect(isGroupForProjectType("editorconfig", "generic")).toBe(true);
      expect(isGroupForProjectType("env", "generic")).toBe(true);
      expect(isGroupForProjectType("docker", "generic")).toBe(true);
    });
  });

  describe("getFixPriority", () => {
    // importance * 3 + effort
    // required=0, recommended=1, opinionated=2
    // low=0, medium=1, high=2

    it("should return 0 for required + low effort", () => {
      expect(getFixPriority([TAG.required, TAG.effort.low])).toBe(0);
    });

    it("should return 1 for required + medium effort", () => {
      expect(getFixPriority([TAG.required, TAG.effort.medium])).toBe(1);
    });

    it("should return 2 for required + high effort", () => {
      expect(getFixPriority([TAG.required, TAG.effort.high])).toBe(2);
    });

    it("should return 3 for recommended + low effort", () => {
      expect(getFixPriority([TAG.recommended, TAG.effort.low])).toBe(3);
    });

    it("should return 4 for recommended + medium effort", () => {
      expect(getFixPriority([TAG.recommended, TAG.effort.medium])).toBe(4);
    });

    it("should return 5 for recommended + high effort", () => {
      expect(getFixPriority([TAG.recommended, TAG.effort.high])).toBe(5);
    });

    it("should return 6 for opinionated + low effort", () => {
      expect(getFixPriority([TAG.opinionated, TAG.effort.low])).toBe(6);
    });

    it("should return 7 for opinionated + medium effort", () => {
      expect(getFixPriority([TAG.opinionated, TAG.effort.medium])).toBe(7);
    });

    it("should return 8 for opinionated + high effort", () => {
      expect(getFixPriority([TAG.opinionated, TAG.effort.high])).toBe(8);
    });

    it("should default to opinionated (2) when no importance tag", () => {
      expect(getFixPriority([TAG.effort.low])).toBe(6); // 2*3 + 0
    });

    it("should default to high effort (2) when no effort tag", () => {
      expect(getFixPriority([TAG.required])).toBe(2); // 0*3 + 2
    });

    it("should use rootTags for effort when provided", () => {
      // Tags say recommended, but rootTags override effort to low
      expect(getFixPriority([TAG.recommended, TAG.effort.high], [TAG.effort.low])).toBe(3);
    });
  });

  describe("getCheckStatus", () => {
    it("should return enabled by default", () => {
      const config = makeConfig();
      const result = getCheckStatus("some-check", [TAG.required], "package-json", config);
      expect(result.status).toBe("enabled");
    });

    it("should return disabled when check is set to off", () => {
      const config = makeConfig({
        checks: { "some-check": "off" },
      });
      const result = getCheckStatus("some-check", [TAG.required], "package-json", config);
      expect(result.status).toBe("disabled");
    });

    it("should return disabled when a tag is off", () => {
      const config = makeConfig({
        tags: { opinionated: "off" },
      });
      const result = getCheckStatus(
        "some-check",
        [TAG.opinionated, TAG.effort.low],
        "package-json",
        config,
      );
      expect(result.status).toBe("disabled");
    });

    it("should return disabled when group is off", () => {
      const config = makeConfig({
        groups: { eslint: "off" },
      });
      const result = getCheckStatus("some-check", [TAG.required], "eslint", config);
      expect(result.status).toBe("disabled");
    });

    describe("skip-until", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("should return muted when skip-until is active", () => {
        vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
        const config = makeConfig({
          checks: { "some-check": "skip-until-2025-06-01" },
        });
        const result = getCheckStatus("some-check", [TAG.required], "package-json", config);
        expect(result.status).toBe("muted");
        expect(result.mutedUntil).toBe("2025-06-01");
      });

      it("should return enabled when skip-until has expired", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
        const config = makeConfig({
          checks: { "some-check": "skip-until-2025-06-01" },
        });
        const result = getCheckStatus("some-check", [TAG.required], "package-json", config);
        expect(result.status).toBe("enabled");
      });
    });
  });

  describe("getValidCheckNames", () => {
    it("should return a non-empty Set", () => {
      const names = getValidCheckNames();
      expect(names.size).toBeGreaterThan(0);
    });

    it("should contain known check names", () => {
      const names = getValidCheckNames();
      expect(names.has("package-json-has-name")).toBe(true);
    });
  });

  describe("getValidGroupNames", () => {
    it("should return a non-empty Set", () => {
      const names = getValidGroupNames();
      expect(names.size).toBeGreaterThan(0);
    });

    it("should contain known group names", () => {
      const names = getValidGroupNames();
      expect(names.has("package-json")).toBe(true);
      expect(names.has("gitignore")).toBe(true);
      expect(names.has("docs")).toBe(true);
    });
  });

  describe("getValidTagNames", () => {
    it("should return a non-empty Set", () => {
      const tags = getValidTagNames();
      expect(tags.size).toBeGreaterThan(0);
    });

    it("should contain known tag values", () => {
      const tags = getValidTagNames();
      expect(tags.has("required")).toBe(true);
      expect(tags.has("recommended")).toBe(true);
      expect(tags.has("effort:low")).toBe(true);
    });
  });

  describe("findCheck", () => {
    it("should find an existing check", () => {
      const found = findCheck("package-json-has-name");
      expect(found).not.toBeNull();
      expect(found!.check.name).toBe("package-json-has-name");
      expect(found!.group).toBe("package-json");
    });

    it("should return null for unknown check", () => {
      expect(findCheck("nonexistent-check-xyz")).toBeNull();
    });
  });

  describe("isFixWithOptions", () => {
    it("should return true for fix with options array", () => {
      const fix = {
        description: "Fix something",
        options: [{ id: "a", label: "Option A", run: async () => ({ success: true, message: "" }) }],
      };
      expect(isFixWithOptions(fix)).toBe(true);
    });

    it("should return false for simple fix", () => {
      const fix = {
        description: "Fix something",
        run: async () => ({ success: true, message: "" }),
      };
      expect(isFixWithOptions(fix)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isFixWithOptions(null)).toBe(false);
      expect(isFixWithOptions(undefined)).toBe(false);
    });
  });

  describe("countMutedChecks", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return 0 for empty config", () => {
      const config = makeConfig();
      expect(countMutedChecks(config)).toBe(0);
    });

    it("should count active skip-until entries", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      const config = makeConfig({
        checks: {
          "check-a": "skip-until-2025-06-01",
          "check-b": "skip-until-2025-12-31",
          "check-c": "off",
          "check-d": "error",
        },
      });
      expect(countMutedChecks(config)).toBe(2);
    });

    it("should not count expired skip-until entries", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const config = makeConfig({
        checks: {
          "check-a": "skip-until-2025-06-01",
        },
      });
      expect(countMutedChecks(config)).toBe(0);
    });

    it("should handle tuple entries", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      const config = makeConfig({
        checks: {
          "check-a": ["skip-until-2025-06-01", { exceptions: [] }],
        },
      });
      expect(countMutedChecks(config)).toBe(1);
    });
  });

  describe("buildFixableMap", () => {
    it("should return a Map with entries for all checks", () => {
      const map = buildFixableMap();
      expect(map.size).toBeGreaterThan(0);
    });

    it("should have boolean values", () => {
      const map = buildFixableMap();
      for (const value of map.values()) {
        expect(typeof value).toBe("boolean");
      }
    });
  });

  describe("buildTagsMap", () => {
    it("should return a Map with entries for all checks", () => {
      const map = buildTagsMap();
      expect(map.size).toBeGreaterThan(0);
    });

    it("should have arrays of tags as values", () => {
      const map = buildTagsMap();
      for (const tags of map.values()) {
        expect(Array.isArray(tags)).toBe(true);
        expect(tags.length).toBeGreaterThan(0);
      }
    });

    it("should match buildFixableMap in size", () => {
      const fixable = buildFixableMap();
      const tags = buildTagsMap();
      expect(tags.size).toBe(fixable.size);
    });
  });
});
