import { describe, it, expect } from "vitest";
import { buildConfig } from "./builder.js";

describe("buildConfig", () => {
  describe("basic preset building", () => {
    it("should build config from base preset", () => {
      const config = buildConfig({ presets: ["base"] });

      expect(config.rules.length).toBeGreaterThan(0);
      expect(config.presets).toEqual(["base"]);
      expect(config.rules.every((r) => r.source === "base")).toBe(true);
    });

    it("should build config from typescript preset", () => {
      const config = buildConfig({ presets: ["typescript"] });

      expect(config.rules.length).toBeGreaterThan(0);
      expect(config.plugins).toContain("@typescript-eslint");
      expect(config.rules.some((r) => r.name.startsWith("@typescript-eslint/"))).toBe(true);
    });

    it("should build config from style preset", () => {
      const config = buildConfig({ presets: ["style"] });

      expect(config.rules.length).toBeGreaterThan(0);
      expect(config.plugins).toContain("@stylistic");
      expect(config.rules.some((r) => r.name.startsWith("@stylistic/"))).toBe(true);
    });
  });

  describe("preset expansion", () => {
    it("should expand preset dependencies", () => {
      const config = buildConfig({ presets: ["typescript"] });

      // typescript extends base, so should include base rules
      const hasBaseRules = config.rules.some((r) => !r.name.includes("/"));
      expect(hasBaseRules).toBe(true);
    });

    it("should not duplicate rules from extended presets", () => {
      const config = buildConfig({ presets: ["base", "typescript"] });
      const ruleNames = config.rules.map((r) => r.name);
      const uniqueNames = new Set(ruleNames);

      expect(ruleNames.length).toBe(uniqueNames.size);
    });
  });

  describe("multiple presets", () => {
    it("should combine multiple presets", () => {
      const config = buildConfig({ presets: ["base", "typescript", "style"] });

      expect(config.presets).toEqual(["base", "typescript", "style"]);
      expect(config.plugins).toContain("@typescript-eslint");
      expect(config.plugins).toContain("@stylistic");
    });

    it("should have later presets override earlier ones", () => {
      const baseConfig = buildConfig({ presets: ["base"] });
      const strictConfig = buildConfig({ presets: ["base", "strict"] });

      // strict should add more rules or make existing ones stricter
      expect(strictConfig.rules.length).toBeGreaterThanOrEqual(baseConfig.rules.length);
    });
  });

  describe("user overrides", () => {
    it("should apply user rule overrides", () => {
      const config = buildConfig({
        presets: ["base"],
        overrides: {
          "no-console": "warn",
        },
      });

      const consoleRule = config.rules.find((r) => r.name === "no-console");
      expect(consoleRule).toBeDefined();
      expect(consoleRule?.value).toBe("warn");
      expect(consoleRule?.comment).toBe("Custom override");
    });

    it("should add new rules via overrides", () => {
      const config = buildConfig({
        presets: ["base"],
        overrides: {
          "custom-rule": "error",
        },
      });

      const customRule = config.rules.find((r) => r.name === "custom-rule");
      expect(customRule).toBeDefined();
      expect(customRule?.value).toBe("error");
    });
  });

  describe("user disables", () => {
    it("should remove disabled rules", () => {
      const baseConfig = buildConfig({ presets: ["base"] });
      const baseRuleNames = baseConfig.rules.map((r) => r.name);

      // Find a rule that exists in base
      const ruleToDisable = baseRuleNames[0];

      const config = buildConfig({
        presets: ["base"],
        disabled: [ruleToDisable],
      });

      const disabledRule = config.rules.find((r) => r.name === ruleToDisable);
      expect(disabledRule).toBeUndefined();
    });
  });

  describe("type-checking requirement", () => {
    it("should not require type-checking for base preset", () => {
      const config = buildConfig({ presets: ["base"] });
      expect(config.requiresTypeChecking).toBe(false);
    });

    it("should require type-checking for strict preset", () => {
      const config = buildConfig({ presets: ["strict"] });
      expect(config.requiresTypeChecking).toBe(true);
    });
  });

  describe("rule sorting", () => {
    it("should sort core rules before typescript rules", () => {
      const config = buildConfig({ presets: ["typescript"] });

      let foundTsRule = false;
      for (const rule of config.rules) {
        if (rule.name.startsWith("@typescript-eslint/")) {
          foundTsRule = true;
        }
        // After we find a TS rule, we shouldn't find core rules
        if (foundTsRule && !rule.name.includes("/")) {
          expect(true).toBe(false); // Core rule found after TS rule
        }
      }
    });

    it("should sort typescript rules before stylistic rules", () => {
      const config = buildConfig({ presets: ["typescript", "style"] });

      let foundStylisticRule = false;
      for (const rule of config.rules) {
        if (rule.name.startsWith("@stylistic/")) {
          foundStylisticRule = true;
        }
        // After we find a stylistic rule, we shouldn't find TS rules
        if (foundStylisticRule && rule.name.startsWith("@typescript-eslint/")) {
          expect(true).toBe(false); // TS rule found after stylistic rule
        }
      }
    });

    it("should sort rules alphabetically within each plugin", () => {
      const config = buildConfig({ presets: ["base"] });

      // Filter to just core rules
      const coreRules = config.rules.filter((r) => !r.name.includes("/"));
      const sortedNames = [...coreRules.map((r) => r.name)].sort();

      expect(coreRules.map((r) => r.name)).toEqual(sortedNames);
    });
  });

  describe("rule comments", () => {
    it("should generate comments for rules", () => {
      const config = buildConfig({ presets: ["base"] });

      expect(config.rules.every((r) => r.comment.length > 0)).toBe(true);
    });
  });
});
