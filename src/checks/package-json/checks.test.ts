import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.ts";
import { loadContext } from "./context.ts";
import { createGlobalContext } from "../../context/global.ts";

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

  describe("field checks", () => {
    it.todo("should pass when name field exists");
    it.todo("should fail when name field is missing");
    it.todo("should pass when all required scripts exist");
    it.todo("should fail when required scripts are missing");
  });
});
