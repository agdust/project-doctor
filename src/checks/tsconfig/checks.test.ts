import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as exists } from "./exists/check.js";
import { check as validJson } from "./valid-json/check.js";
import { check as strictEnabled } from "./strict-enabled/check.js";
import { check as hasOutDir } from "./has-outdir/check.js";

describe("tsconfig checks", () => {
  describe("exists", () => {
    it("should pass when tsconfig.json exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when tsconfig.json is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("validJson", () => {
    it("should pass for valid JSON", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await validJson.run(global, ctx);

      expect(result.status).toBe("pass");
    });
  });

  describe("strictEnabled", () => {
    it("should pass when strict mode is enabled", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await strictEnabled.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when strict mode is disabled", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await strictEnabled.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("hasOutDir", () => {
    it("should pass when outDir is set", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hasOutDir.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when outDir is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await hasOutDir.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });
});
