import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as repoExists } from "./repo-exists/check.js";
import { check as ciLockfile } from "./ci-lockfile/check.js";
import type { GlobalContext } from "../../types.js";
import type { GitContext } from "./context.js";

const mockGlobal = {} as GlobalContext;

function mockCtx(overrides: Partial<GitContext>): GitContext {
  return { isRepo: true, ciWorkflows: [], ...overrides };
}

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

    it("should load CI workflows", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.ciWorkflows.length).toBeGreaterThan(0);
      expect(ctx.ciWorkflows[0]).toContain("npm ci");
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

  describe("ci-lockfile", () => {
    it("should pass when CI uses npm ci", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await ciLockfile.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when CI uses npm install", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await ciLockfile.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("npm install");
    });

    it("should skip when no CI workflows found", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await ciLockfile.run(global, ctx);

      expect(result.status).toBe("skip");
    });

    it("should pass when CI uses yarn --immutable", async () => {
      const ctx = mockCtx({ ciWorkflows: ["- run: yarn install --immutable"] });
      const result = await ciLockfile.run(mockGlobal, ctx);

      expect(result.status).toBe("pass");
    });

    it("should pass when CI uses pnpm --frozen-lockfile", async () => {
      const ctx = mockCtx({ ciWorkflows: ["- run: pnpm install --frozen-lockfile"] });
      const result = await ciLockfile.run(mockGlobal, ctx);

      expect(result.status).toBe("pass");
    });

    it("should skip when no install commands found", async () => {
      const ctx = mockCtx({ ciWorkflows: ["- run: npm test\n- run: npm run build"] });
      const result = await ciLockfile.run(mockGlobal, ctx);

      expect(result.status).toBe("skip");
      expect(result.message).toContain("No package installation commands");
    });
  });
});
