import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as hasTestScript } from "./has-test-script/check.js";

describe("testing checks", () => {
  describe("context loading", () => {
    it("should detect test script in healthy project", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.hasTestScript).toBe(true);
      expect(ctx.testScriptValue).toBeTruthy();
    });

    it("should detect no test script in broken project", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);

      expect(ctx.hasTestScript).toBe(false);
      expect(ctx.testScriptValue).toBeNull();
    });
  });

  describe("hasTestScript", () => {
    it("should pass when test script exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hasTestScript.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when test script is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await hasTestScript.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });
});
