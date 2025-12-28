import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as jestConfigExists } from "./jest-config-exists/check.js";
import { check as vitestConfigExists } from "./vitest-config-exists/check.js";
import { check as playwrightConfigExists } from "./playwright-config-exists/check.js";
import { check as cypressConfigExists } from "./cypress-config-exists/check.js";

describe("testing checks", () => {
  describe("context loading", () => {
    it("should detect vitest config", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.hasVitest).toBe(true);
      expect(ctx.hasJest).toBe(false);
      expect(ctx.hasPlaywright).toBe(false);
      expect(ctx.hasCypress).toBe(false);
    });

    it("should detect no configs in broken project", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);

      expect(ctx.hasVitest).toBe(false);
      expect(ctx.hasJest).toBe(false);
    });
  });

  describe("vitestConfigExists", () => {
    it("should pass when vitest.config.ts exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await vitestConfigExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when vitest.config.ts is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await vitestConfigExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("jestConfigExists", () => {
    it("should fail when jest.config.js is missing", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await jestConfigExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("playwrightConfigExists", () => {
    it("should fail when playwright.config.ts is missing", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await playwrightConfigExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("cypressConfigExists", () => {
    it("should fail when cypress.config.ts is missing", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await cypressConfigExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });
});
