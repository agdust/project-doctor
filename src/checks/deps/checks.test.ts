import { describe, it, expect } from "vitest";
import { check as disabledPostInstallScripts } from "./disabled-post-install-scripts/check.js";
import { check as lockfileLint } from "./lockfile-lint/check.js";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import type { GlobalContext } from "../../types.js";
import type { DepsContext } from "./context.js";

const mockGlobal = {} as GlobalContext;

function mockCtx(overrides: Partial<DepsContext>): DepsContext {
  return {
    hasPackageLock: false,
    hasYarnLock: false,
    hasPnpmLock: false,
    lockfileType: null,
    npmrc: null,
    npmrcGitignored: false,
    devDependencies: {},
    scripts: {},
    ...overrides,
  };
}

describe("deps checks", () => {
  describe("context loading", () => {
    it("should load devDependencies from healthy project", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.devDependencies).toBeDefined();
      expect(ctx.scripts).toBeDefined();
    });
  });

  describe("disabled-post-install-scripts", () => {
    it("should pass when ignore-scripts=true in .npmrc", async () => {
      const ctx = mockCtx({ npmrc: "ignore-scripts=true\n" });
      const result = await disabledPostInstallScripts.run(mockGlobal, ctx);

      expect(result.status).toBe("pass");
    });

    it("should pass with spaces around equals", async () => {
      const ctx = mockCtx({ npmrc: "ignore-scripts = true\n" });
      const result = await disabledPostInstallScripts.run(mockGlobal, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .npmrc is missing", async () => {
      const ctx = mockCtx({ npmrc: null });
      const result = await disabledPostInstallScripts.run(mockGlobal, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain(".npmrc not found");
    });

    it("should fail when ignore-scripts is not set", async () => {
      const ctx = mockCtx({ npmrc: "registry=https://registry.npmjs.org\n" });
      const result = await disabledPostInstallScripts.run(mockGlobal, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not disabled");
    });

    it("should skip when .npmrc is gitignored", async () => {
      const ctx = mockCtx({ npmrcGitignored: true });
      const result = await disabledPostInstallScripts.run(mockGlobal, ctx);

      expect(result.status).toBe("skip");
    });
  });

  describe("lockfile-lint", () => {
    it("should pass when lockfile-lint is installed and has script", async () => {
      const ctx = mockCtx({
        devDependencies: { "lockfile-lint": "^4.0.0" },
        scripts: { "lint:lockfile": "lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https" },
      });
      const result = await lockfileLint.run(mockGlobal, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when lockfile-lint is not installed", async () => {
      const ctx = mockCtx({
        devDependencies: {},
        scripts: {},
      });
      const result = await lockfileLint.run(mockGlobal, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not found in devDependencies");
    });

    it("should fail when lockfile-lint is installed but no script", async () => {
      const ctx = mockCtx({
        devDependencies: { "lockfile-lint": "^4.0.0" },
        scripts: { test: "vitest" },
      });
      const result = await lockfileLint.run(mockGlobal, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("no script configured");
    });
  });
});
