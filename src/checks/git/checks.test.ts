import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as repoExists } from "./repo-exists/check.js";

describe("git checks", () => {
  describe("context loading", () => {
    it("should detect git repo", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.isRepo).toBe(true);
    });

    it("should detect non-repo", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);

      expect(ctx.isRepo).toBe(false);
    });
  });

  describe("repoExists", () => {
    it("should pass when .git exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await repoExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .git is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await repoExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });
});
