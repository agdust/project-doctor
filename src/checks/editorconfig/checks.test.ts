import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { exists, hasRoot, hasIndent } from "./checks.js";

describe("editorconfig checks", () => {
  describe("exists", () => {
    it("should pass when .editorconfig exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .editorconfig is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("hasRoot", () => {
    it("should pass when root = true is present", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hasRoot.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when root = true is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await hasRoot.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("hasIndent", () => {
    it("should pass when indent settings are present", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hasIndent.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should pass when indent_style is present (even without root)", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await hasIndent.run(global, ctx);

      expect(result.status).toBe("pass");
    });
  });
});
