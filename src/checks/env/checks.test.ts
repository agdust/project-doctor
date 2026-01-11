import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as exampleExists } from "./example-exists/check.js";
import { check as exampleNotEmpty } from "./example-not-empty/check.js";
import { check as exampleComplete } from "./example-complete/check.js";

describe("env checks", () => {
  describe("context loading", () => {
    it("should parse .env and .env.example vars", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.envExists).toBe(true);
      expect(ctx.envVars).toContain("DATABASE_URL");
      expect(ctx.envVars).toContain("API_KEY");
      expect(ctx.exampleExists).toBe(true);
      expect(ctx.exampleVars).toContain("DATABASE_URL");
      expect(ctx.exampleVars).toContain("API_KEY");
    });

    it("should handle missing .env.example", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);

      expect(ctx.envExists).toBe(true);
      expect(ctx.exampleExists).toBe(false);
      expect(ctx.exampleVars).toEqual([]);
    });
  });

  describe("exampleExists", () => {
    it("should pass when both .env and .env.example exist", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exampleExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .env exists but .env.example is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await exampleExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });

    it("should skip when .env does not exist", async () => {
      const global = await createGlobalContext(fixtures.minimal);
      const ctx = await loadContext(global);
      const result = await exampleExists.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });

  describe("exampleNotEmpty", () => {
    it("should pass when .env.example has vars", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exampleNotEmpty.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should skip when .env.example is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await exampleNotEmpty.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });

  describe("exampleComplete", () => {
    it("should pass when .env.example has all vars from .env", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exampleComplete.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should skip when .env does not exist", async () => {
      const global = await createGlobalContext(fixtures.minimal);
      const ctx = await loadContext(global);
      const result = await exampleComplete.run(global, ctx);

      expect(result.status).toBe("skip");
    });

    it("should skip when .env.example does not exist", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await exampleComplete.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });
});
