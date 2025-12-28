import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as repoExists } from "./repo-exists/check.js";
import { check as hooksInstalled } from "./hooks-installed/check.js";
import { check as conventionalCommits } from "./conventional-commits/check.js";

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

  describe("hooksInstalled", () => {
    it("should skip when not a git repo", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await hooksInstalled.run(global, ctx);

      expect(result.status).toBe("skip");
    });

    it("should fail when no hooks are configured", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await hooksInstalled.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("conventionalCommits", () => {
    it("should skip when not a git repo", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await conventionalCommits.run(global, ctx);

      expect(result.status).toBe("skip");
    });

    it("should fail when commitlint is not configured", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await conventionalCommits.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });
});
