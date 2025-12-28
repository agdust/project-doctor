import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as exampleExists } from "./example-exists/check.js";
import { check as exampleNotEmpty } from "./example-not-empty/check.js";

describe("env checks", () => {
  describe("context loading", () => {
    it("should parse .env.example vars", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.exampleRaw).not.toBeNull();
      expect(ctx.exampleVars).toContain("DATABASE_URL");
      expect(ctx.exampleVars).toContain("API_KEY");
    });

    it("should return null for missing .env.example", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);

      expect(ctx.exampleRaw).toBeNull();
      expect(ctx.exampleVars).toEqual([]);
    });
  });

  describe("exampleExists", () => {
    it("should pass when .env.example exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exampleExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .env.example is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await exampleExists.run(global, ctx);

      expect(result.status).toBe("fail");
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
});
