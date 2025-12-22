import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { configExists } from "./checks.js";

describe("prettier checks", () => {
  describe("context loading", () => {
    it("should detect .prettierrc file", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.hasConfig).toBe(true);
    });

    it("should return false when no config exists", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);

      expect(ctx.hasConfig).toBe(false);
    });
  });

  describe("configExists", () => {
    it("should pass when config exists and prettier is detected", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      global.detected.hasPrettier = true;
      const ctx = await loadContext(global);
      const result = await configExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when config is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      global.detected.hasPrettier = true;
      const ctx = await loadContext(global);
      const result = await configExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });

    it("should skip when prettier is not detected", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      global.detected.hasPrettier = false;
      const ctx = await loadContext(global);
      const result = await configExists.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });
});
