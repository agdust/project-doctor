import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { exists, valid, hasName, hasVersion, typeModule, hasEngines } from "./checks.js";

describe("package-json checks", () => {
  describe("context loading", () => {
    it("should parse valid package.json", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.parsed).not.toBeNull();
      expect(ctx.parsed?.name).toBe("healthy-project");
      expect(ctx.parseError).toBeNull();
    });

    it("should return null for missing package.json", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);

      expect(ctx.raw).toBeNull();
      expect(ctx.parsed).toBeNull();
    });
  });

  describe("exists", () => {
    it("should pass when package.json exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when package.json is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("hasName", () => {
    it("should pass when name field exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hasName.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when name field is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await hasName.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("typeModule", () => {
    it("should pass when type: module is set", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await typeModule.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when type: module is not set", async () => {
      const global = await createGlobalContext(fixtures.minimal);
      const ctx = await loadContext(global);
      const result = await typeModule.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("hasEngines", () => {
    it("should pass when engines.node is set", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hasEngines.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when engines is missing", async () => {
      const global = await createGlobalContext(fixtures.minimal);
      const ctx = await loadContext(global);
      const result = await hasEngines.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });
});
