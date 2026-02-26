import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as configExists } from "./config-exists/check.js";

describe("jscpd checks", () => {
  describe("context loading", () => {
    it("should return false when no config exists", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);

      expect(ctx.hasConfig).toBe(false);
    });
  });

  describe("configExists", () => {
    it("should skip when jscpd is not detected", async () => {
      const global = await createGlobalContext(fixtures.empty);
      global.detected.hasJscpd = false;
      const ctx = await loadContext(global);
      const result = await configExists.run(global, ctx);

      expect(result.status).toBe("skip");
    });

    it("should fail when config is missing but jscpd is detected", async () => {
      const global = await createGlobalContext(fixtures.empty);
      global.detected.hasJscpd = true;
      const ctx = await loadContext(global);
      const result = await configExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });

    it("should pass when config exists", async () => {
      const global = await createGlobalContext(fixtures.empty);
      global.detected.hasJscpd = true;
      const ctx = { hasConfig: true };
      const result = await configExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });
  });
});
