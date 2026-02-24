import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext, type NpmSecurityContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as disabledNodePostInstallScripts } from "./disabled-node-post-install-scripts/check.js";
import { check as lockfileLint } from "./lockfile-lint/check.js";
import { check as envGitignored } from "./env-gitignored/check.js";
import { check as devcontainer } from "./devcontainer/check.js";
import { check as ciLockfile } from "./ci-lockfile/check.js";
import { parseGitignore } from "../../utils/gitignore.js";

// Helper to create a mock context for testing edge cases
function createMockContext(overrides: Partial<NpmSecurityContext>): NpmSecurityContext {
  const gitignore = overrides.gitignore ?? null;
  return {
    npmrc: null,
    npmrcGitignored: false,
    gitignore,
    gitignoreInstance: gitignore ? parseGitignore(gitignore) : null,
    hasDevcontainer: false,
    devDependencies: {},
    scripts: {},
    ciWorkflows: [],
    pnpmConfig: null,
    ...overrides,
  };
}

describe("npm-security checks", () => {
  describe("context loading", () => {
    it("should load .npmrc content", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.npmrc).not.toBeNull();
      expect(ctx.npmrc).toContain("ignore-scripts=true");
    });

    it("should load CI workflows", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.ciWorkflows.length).toBeGreaterThan(0);
      expect(ctx.ciWorkflows[0]).toContain("npm ci");
    });

    it("should detect devcontainer", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.hasDevcontainer).toBe(true);
    });

    it("should handle missing files gracefully", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);

      expect(ctx.npmrc).toBeNull();
      expect(ctx.gitignore).toBeNull();
      expect(ctx.hasDevcontainer).toBe(false);
      expect(ctx.ciWorkflows).toEqual([]);
    });

    it("should detect when .npmrc is gitignored", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      // healthy fixture gitignores .npmrc (for security - auth tokens)
      expect(ctx.npmrcGitignored).toBe(true);
    });
  });

  describe("disabled-node-post-install-scripts", () => {
    it("should pass when ignore-scripts=true is in .npmrc", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        npmrc: "ignore-scripts=true",
        npmrcGitignored: false,
      });
      const result = await disabledNodePostInstallScripts.run(global, ctx);

      expect(result.status).toBe("pass");
      expect(result.message).toContain("disabled");
    });

    it("should fail when .npmrc is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await disabledNodePostInstallScripts.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not found");
    });

    it("should fail when ignore-scripts is not set", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await disabledNodePostInstallScripts.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not disabled");
    });

    it("should fail when ignore-scripts=false", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        npmrc: "ignore-scripts=false",
      });
      const result = await disabledNodePostInstallScripts.run(global, ctx);

      expect(result.status).toBe("fail");
    });

    it("should pass with whitespace around ignore-scripts=true", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        npmrc: "  ignore-scripts = true  ",
      });
      const result = await disabledNodePostInstallScripts.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should skip when .npmrc is gitignored", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        npmrc: "some-config=value",
        npmrcGitignored: true,
      });
      const result = await disabledNodePostInstallScripts.run(global, ctx);

      expect(result.status).toBe("skip");
      expect(result.message).toContain("gitignored");
    });
  });

  describe("lockfile-lint", () => {
    it("should pass when lockfile-lint is installed and configured", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await lockfileLint.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when lockfile-lint is not in devDependencies", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        devDependencies: { typescript: "^5.0.0" },
        scripts: { lint: "lockfile-lint" },
      });
      const result = await lockfileLint.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not found in devDependencies");
    });

    it("should fail when lockfile-lint installed but no script uses it", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        devDependencies: { "lockfile-lint": "^4.0.0" },
        scripts: { lint: "eslint ." },
      });
      const result = await lockfileLint.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("no script configured");
    });

    it("should pass when lockfile-lint is in a CI script", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        devDependencies: { "lockfile-lint": "^4.0.0" },
        scripts: { ci: "npm run test && lockfile-lint --path package-lock.json" },
      });
      const result = await lockfileLint.run(global, ctx);

      expect(result.status).toBe("pass");
    });
  });

  describe("env-gitignored", () => {
    it("should pass when .env is in .gitignore", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await envGitignored.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .gitignore is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await envGitignored.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain(".gitignore not found");
    });

    it("should fail when .env is not in .gitignore", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        gitignore: "node_modules\ndist\n",
      });
      const result = await envGitignored.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not ignored");
    });

    it("should pass when .env.* pattern is in .gitignore", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        gitignore: "node_modules\n.env.*\n",
      });
      const result = await envGitignored.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should pass when .env.local is in .gitignore", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        gitignore: "node_modules\n.env.local\n",
      });
      const result = await envGitignored.run(global, ctx);

      expect(result.status).toBe("pass");
    });
  });

  describe("devcontainer", () => {
    it("should pass when devcontainer exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await devcontainer.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when devcontainer is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await devcontainer.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("No dev container");
    });

    it("should fail when hasDevcontainer is false", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        hasDevcontainer: false,
      });
      const result = await devcontainer.run(global, ctx);

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
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        ciWorkflows: ["- run: yarn install --immutable"],
      });
      const result = await ciLockfile.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should pass when CI uses pnpm --frozen-lockfile", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        ciWorkflows: ["- run: pnpm install --frozen-lockfile"],
      });
      const result = await ciLockfile.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should pass when CI uses bun --frozen-lockfile", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        ciWorkflows: ["- run: bun install --frozen-lockfile"],
      });
      const result = await ciLockfile.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should skip when no install commands found", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = createMockContext({
        ciWorkflows: ["- run: npm test\n- run: npm run build"],
      });
      const result = await ciLockfile.run(global, ctx);

      expect(result.status).toBe("skip");
      expect(result.message).toContain("No package installation commands");
    });
  });
});
