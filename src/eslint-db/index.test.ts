import { describe, it, expect } from "vitest";
import {
  getAllPlugins,
  getAllRules,
  getPluginByName,
  getRulesByTags,
  getRulesExcludingTags,
  getRulesByStrictness,
  getTaggedRules,
  queryRules,
  getStats,
  groupRulesByPlugin,
} from "./index.js";

describe("eslint-db", () => {
  describe("getAllPlugins", () => {
    it("should return all registered plugins", () => {
      const plugins = getAllPlugins();
      expect(plugins.length).toBe(3);
      expect(plugins.map((p) => p.name)).toContain("eslint");
      expect(plugins.map((p) => p.name)).toContain("@typescript-eslint/eslint-plugin");
      expect(plugins.map((p) => p.name)).toContain("@stylistic/eslint-plugin");
    });
  });

  describe("getPluginByName", () => {
    it("should find plugin by exact name", () => {
      const plugin = getPluginByName("@typescript-eslint/eslint-plugin");
      expect(plugin).toBeDefined();
      expect(plugin?.prefix).toBe("@typescript-eslint");
    });

    it("should find plugin by prefix", () => {
      const plugin = getPluginByName("@typescript-eslint");
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe("@typescript-eslint/eslint-plugin");
    });

    it("should return undefined for unknown plugin", () => {
      const plugin = getPluginByName("unknown-plugin");
      expect(plugin).toBeUndefined();
    });
  });

  describe("getAllRules", () => {
    it("should return rules from all plugins", () => {
      const rules = getAllRules();
      expect(rules.length).toBeGreaterThan(100);

      // Should have rules from core, typescript, and stylistic
      const hasCore = rules.some((r) => r.name === "no-unused-vars");
      const hasTs = rules.some((r) => r.name === "@typescript-eslint/no-explicit-any");
      const hasStyle = rules.some((r) => r.name === "@stylistic/indent");

      expect(hasCore).toBe(true);
      expect(hasTs).toBe(true);
      expect(hasStyle).toBe(true);
    });
  });

  describe("getRulesByTags", () => {
    it("should filter rules by single tag", () => {
      const rules = getRulesByTags(["security"]);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.tags.includes("security"))).toBe(true);
    });

    it("should filter rules by multiple tags (any match)", () => {
      const rules = getRulesByTags(["security", "type-safety"]);
      expect(rules.length).toBeGreaterThan(0);
      expect(
        rules.every((r) => r.tags.includes("security") || r.tags.includes("type-safety"))
      ).toBe(true);
    });

    it("should filter rules by multiple tags (all match)", () => {
      const rules = getRulesByTags(["type-safety", "essential"], true);
      expect(rules.length).toBeGreaterThan(0);
      expect(
        rules.every((r) => r.tags.includes("type-safety") && r.tags.includes("essential"))
      ).toBe(true);
    });
  });

  describe("getRulesExcludingTags", () => {
    it("should exclude rules with specified tags", () => {
      const rules = getRulesExcludingTags(["pedantic"]);
      expect(rules.every((r) => !r.tags.includes("pedantic"))).toBe(true);
    });
  });

  describe("getRulesByStrictness", () => {
    it("should return only rules up to specified strictness", () => {
      const essentialOnly = getRulesByStrictness("essential");
      const upToRecommended = getRulesByStrictness("recommended");
      const upToStrict = getRulesByStrictness("strict");

      expect(essentialOnly.length).toBeLessThan(upToRecommended.length);
      expect(upToRecommended.length).toBeLessThan(upToStrict.length);
    });
  });

  describe("getTaggedRules", () => {
    it("should only return rules with tags", () => {
      const tagged = getTaggedRules();
      expect(tagged.length).toBeGreaterThan(0);
      expect(tagged.every((r) => r.tags.length > 0)).toBe(true);
    });
  });

  describe("queryRules", () => {
    it("should filter by plugin", () => {
      const rules = queryRules({ plugins: ["@typescript-eslint"], taggedOnly: true });
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.name.startsWith("@typescript-eslint/"))).toBe(true);
    });

    it("should filter by multiple criteria", () => {
      const rules = queryRules({
        plugins: ["@typescript-eslint"],
        includeTags: ["essential"],
        excludeTags: ["style"],
      });
      expect(rules.length).toBeGreaterThan(0);
      expect(
        rules.every(
          (r) =>
            r.name.startsWith("@typescript-eslint/") &&
            r.tags.includes("essential") &&
            !r.tags.includes("style")
        )
      ).toBe(true);
    });

    it("should exclude deprecated rules by default", () => {
      const rules = queryRules({ taggedOnly: true });
      expect(rules.every((r) => !r.deprecated)).toBe(true);
    });

    it("should include deprecated rules when requested", () => {
      const rules = queryRules({ includeDeprecated: true });
      const hasDeprecated = rules.some((r) => r.deprecated);
      expect(hasDeprecated).toBe(true);
    });

    it("should filter to tagged rules only", () => {
      const tagged = queryRules({ taggedOnly: true });
      const all = queryRules({ includeDeprecated: true });
      expect(tagged.length).toBeLessThan(all.length);
      expect(tagged.every((r) => r.tags.length > 0)).toBe(true);
    });
  });

  describe("groupRulesByPlugin", () => {
    it("should group rules by their plugin", () => {
      const rules = getAllRules();
      const grouped = groupRulesByPlugin(rules);

      expect(grouped.has("eslint")).toBe(true);
      expect(grouped.has("@typescript-eslint/eslint-plugin")).toBe(true);
      expect(grouped.has("@stylistic/eslint-plugin")).toBe(true);
    });
  });

  describe("getStats", () => {
    it("should return accurate statistics", () => {
      const stats = getStats();

      expect(stats.totalPlugins).toBe(3);
      expect(stats.totalRules).toBeGreaterThan(100);
      expect(stats.taggedRules).toBeGreaterThan(0);
      expect(stats.taggedRules).toBeLessThan(stats.totalRules);
      expect(stats.fixableRules).toBeGreaterThan(0);
      expect(stats.rulesByStrictness.essential).toBeGreaterThan(0);
      expect(stats.rulesByStrictness.recommended).toBeGreaterThan(0);
    });
  });
});
