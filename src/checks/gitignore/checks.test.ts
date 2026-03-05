import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as exists } from "./exists/check.js";
import { check as hasNodeModules } from "./has-node-modules/check.js";
import { check as lockfileNotIgnored } from "./lockfile-not-ignored/check.js";

describe("gitignore checks", () => {
  describe("context loading", () => {
    it("should parse .gitignore patterns", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.raw).not.toBeNull();
      expect(ctx.patterns).toContain("node_modules");
      expect(ctx.patterns).toContain("dist");
    });

    it("should return null for missing .gitignore", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);

      expect(ctx.raw).toBeNull();
      expect(ctx.patterns).toEqual([]);
    });
  });

  describe("exists", () => {
    it("should pass when .gitignore exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .gitignore is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("hasNodeModules", () => {
    it("should pass when node_modules is ignored", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hasNodeModules.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when node_modules is not ignored", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await hasNodeModules.run(global, ctx);

      expect(result.status).toBe("fail");
    });

    it("should skip when .gitignore is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await hasNodeModules.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });

  describe("lockfileNotIgnored", () => {
    it("should pass when lockfiles are not ignored", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await lockfileNotIgnored.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when lockfile is ignored", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await lockfileNotIgnored.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("package-lock.json");
    });

    it("should skip when .gitignore is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await lockfileNotIgnored.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });
});
