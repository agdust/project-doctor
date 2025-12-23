import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as configExists } from "./config-exists/check.js";
import { check as flatConfig } from "./flat-config/check.js";
import { check as noLegacyConfig } from "./no-legacy-config/check.js";

describe("eslint checks", () => {
  describe("context loading", () => {
    it("should detect flat config file", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.hasFlatConfig).toBe(true);
      expect(ctx.flatConfigFile).toBe("eslint.config.js");
      expect(ctx.hasLegacyConfig).toBe(false);
    });

    it("should detect legacy config file", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);

      expect(ctx.hasFlatConfig).toBe(false);
      expect(ctx.hasLegacyConfig).toBe(true);
    });
  });

  describe("flatConfig", () => {
    it("should pass when using flat config", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      // Override detection to simulate ESLint being installed
      global.detected.hasEslint = true;
      const ctx = await loadContext(global);
      const result = await flatConfig.run(global, ctx);

      expect(result.status).toBe("pass");
      expect(result.message).toContain("eslint.config.js");
    });

    it("should fail when using legacy config", async () => {
      const global = await createGlobalContext(fixtures.broken);
      global.detected.hasEslint = true;
      const ctx = await loadContext(global);
      const result = await flatConfig.run(global, ctx);

      expect(result.status).toBe("fail");
    });

    it("should skip when ESLint is not detected", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      global.detected.hasEslint = false;
      const ctx = await loadContext(global);
      const result = await flatConfig.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });

  describe("noLegacyConfig", () => {
    it("should pass when no legacy config exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      global.detected.hasEslint = true;
      const ctx = await loadContext(global);
      const result = await noLegacyConfig.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should warn when legacy config exists", async () => {
      const global = await createGlobalContext(fixtures.broken);
      global.detected.hasEslint = true;
      const ctx = await loadContext(global);
      const result = await noLegacyConfig.run(global, ctx);

      expect(result.status).toBe("warn");
    });
  });
});
