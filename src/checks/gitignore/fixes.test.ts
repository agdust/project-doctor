import { describe, it, expect, afterEach } from "vitest";
import { createGlobalContext } from "../../context/global.js";
import { loadContext } from "./context.js";
import {
  copyFixtureToTemp,
  createEmptyTempDir,
  type TempFixture,
} from "../../test/fix-test-utils.js";
import { check as noDuplicates } from "./no-duplicates/check.js";
import { check as noSecretsCommitted } from "./no-secrets-in-git/check.js";
import { check as lockfileNotIgnored } from "./lockfile-not-ignored/check.js";

describe("gitignore fixes", () => {
  let tempFixture: TempFixture;

  afterEach(async () => {
    if (tempFixture) {
      await tempFixture.cleanup();
    }
  });

  describe("no-duplicates fix", () => {
    it("should remove duplicate patterns using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (fixable has duplicates)
      const checkResult = await noDuplicates.run(global, ctx);
      expect(checkResult.status).toBe("fail");
      expect(checkResult.message).toContain("Duplicates");

      // Run fix
      const fix = noDuplicates.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify .gitignore was deduplicated
      const content = await tempFixture.readFile(".gitignore");
      const lines = content.split("\n").filter((l) => l.trim());
      expect(lines.filter((l) => l === "node_modules").length).toBe(1);
      expect(lines.filter((l) => l === "dist").length).toBe(1);

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await noDuplicates.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should preserve comments when deduplicating", async () => {
      tempFixture = await createEmptyTempDir("gitignore-comments");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(
        ".gitignore",
        `# Build output
dist
# Dependencies
node_modules
# Duplicates below
dist
node_modules
`,
      );

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noDuplicates.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await tempFixture.readFile(".gitignore");
      expect(content).toContain("# Build output");
      expect(content).toContain("# Dependencies");
    });

    it("should preserve empty lines structure", async () => {
      tempFixture = await createEmptyTempDir("gitignore-empty-lines");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(
        ".gitignore",
        `node_modules

dist
dist
`,
      );

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noDuplicates.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await tempFixture.readFile(".gitignore");
      // Should still have the empty line structure
      expect(content).toContain("node_modules\n\ndist");
    });

    it("should pass for healthy project (no duplicates)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await noDuplicates.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("no-secrets-in-git fix", () => {
    it("should add missing secret files to gitignore using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (fixable has .env and credentials.json not ignored)
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = noSecretsCommitted.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify .gitignore was updated
      const content = await tempFixture.readFile(".gitignore");
      expect(content).toContain(".env");
      expect(content).toContain("credentials.json");
      expect(content).toContain("# Secret files");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await noSecretsCommitted.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should add multiple missing secret files", async () => {
      tempFixture = await createEmptyTempDir("gitignore-secrets-multiple");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n");
      // Create multiple secret files
      await tempFixture.writeFile(".env", "SECRET=value");
      await tempFixture.writeFile(".env.local", "LOCAL_SECRET=value");
      await tempFixture.writeFile(".npmrc", "//registry.npmjs.org/:_authToken=token");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const content = await tempFixture.readFile(".gitignore");
      expect(content).toContain(".env");
      expect(content).toContain(".env.local");
      expect(content).toContain(".npmrc");
    });

    it("should not add files that don't exist", async () => {
      tempFixture = await createEmptyTempDir("gitignore-secrets-nonexistent");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n");
      // Only create .env, not .env.local or credentials.json
      await tempFixture.writeFile(".env", "SECRET=value");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await tempFixture.readFile(".gitignore");
      expect(content).toContain(".env");
      // Should not add files that don't exist
      expect(content).not.toContain("credentials.json");
      expect(content).not.toContain("secrets.json");
    });

    it("should not add files already ignored", async () => {
      tempFixture = await createEmptyTempDir("gitignore-secrets-already-ignored");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n.env\n");
      await tempFixture.writeFile(".env", "SECRET=value");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Check should pass since .env is already ignored
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });

    it("should handle gitignore without trailing newline", async () => {
      tempFixture = await createEmptyTempDir("gitignore-secrets-no-newline");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist"); // No trailing newline
      await tempFixture.writeFile(".env", "SECRET=value");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await tempFixture.readFile(".gitignore");
      // Should properly handle no trailing newline
      expect(content).toContain(".env");
      expect(content).not.toContain("dist.env"); // Should not concatenate
    });

    it("should do nothing if no secret files to add", async () => {
      tempFixture = await createEmptyTempDir("gitignore-secrets-none");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n.env\n.env.local\n");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain("No secret files to add");
    });

    it("should pass for healthy project (secrets properly ignored)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("fix idempotency", () => {
    it("should be safe to run no-duplicates fix twice", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noDuplicates.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);

      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      await fix.run(global2, ctx2);

      const content = await tempFixture.readFile(".gitignore");
      const nodeModulesCount = content
        .split("\n")
        .filter((l) => l.trim() === "node_modules").length;
      expect(nodeModulesCount).toBe(1);
    });

    it("should be safe to run secrets fix twice", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);

      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const result = await fix.run(global2, ctx2);

      // Second run should report nothing to add
      expect(result.message).toContain("No secret files to add");
    });
  });

  describe("wildcard pattern matching", () => {
    it("should recognize wildcard patterns that cover secret files", async () => {
      tempFixture = await createEmptyTempDir("gitignore-wildcard");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n.env*\n");
      await tempFixture.writeFile(".env", "SECRET=value");
      await tempFixture.writeFile(".env.local", "LOCAL=value");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Check should pass since .env* pattern covers both files
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("broken fixture tests", () => {
    it("should detect missing .env in gitignore for broken fixture", async () => {
      tempFixture = await copyFixtureToTemp("broken");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Broken project has .env file but gitignore doesn't include it
      // Let's check if this is detected
      const content = await tempFixture.readFile(".gitignore");
      // If .env exists and isn't in gitignore, the check should fail
      const envExists = await global.files.exists(".env");
      if (envExists && !content.includes(".env")) {
        const checkResult = await noSecretsCommitted.run(global, ctx);
        expect(checkResult.status).toBe("fail");
      }
    });

    it("should pass when .npmrc exists without auth tokens", async () => {
      tempFixture = await createEmptyTempDir("gitignore-npmrc-safe");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n");
      // .npmrc with only safe configuration, no auth tokens
      await tempFixture.writeFile(
        ".npmrc",
        "ignore-scripts=true\nregistry=https://registry.npmjs.org/\n",
      );

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Check should pass since .npmrc doesn't contain auth tokens
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });

    it("should fail when .npmrc contains auth tokens", async () => {
      tempFixture = await createEmptyTempDir("gitignore-npmrc-auth");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n");
      // .npmrc with auth token - should be flagged
      await tempFixture.writeFile(".npmrc", "//registry.npmjs.org/:_authToken=npm_xyz123\n");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Check should fail since .npmrc contains auth token
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("fail");
      expect(checkResult.message).toContain(".npmrc");
    });

    it("should fail when .npmrc contains legacy _auth", async () => {
      tempFixture = await createEmptyTempDir("gitignore-npmrc-legacy-auth");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\ndist\n");
      // .npmrc with legacy _auth format
      await tempFixture.writeFile(".npmrc", "_auth=dXNlcm5hbWU6cGFzc3dvcmQ=\n");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("fail");
      expect(checkResult.message).toContain(".npmrc");
    });
  });

  describe("empty fixture tests", () => {
    it("should skip when no gitignore exists", async () => {
      tempFixture = await copyFixtureToTemp("empty");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await noDuplicates.run(global, ctx);
      expect(checkResult.status).toBe("skip");
    });
  });

  describe("lockfile-not-ignored fix", () => {
    it("should remove lockfile patterns from gitignore", async () => {
      tempFixture = await createEmptyTempDir("lockfile-ignored");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\npackage-lock.json\ndist\n");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await lockfileNotIgnored.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = lockfileNotIgnored.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify pattern was removed
      const content = await tempFixture.readFile(".gitignore");
      expect(content).not.toContain("package-lock.json");
      expect(content).toContain("node_modules");
      expect(content).toContain("dist");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await lockfileNotIgnored.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should remove multiple lockfile patterns", async () => {
      tempFixture = await createEmptyTempDir("lockfile-multiple");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(
        ".gitignore",
        "node_modules\npackage-lock.json\nyarn.lock\npnpm-lock.yaml\ndist\n",
      );

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = lockfileNotIgnored.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await tempFixture.readFile(".gitignore");
      expect(content).not.toContain("package-lock.json");
      expect(content).not.toContain("yarn.lock");
      expect(content).not.toContain("pnpm-lock.yaml");
    });

    it("should remove wildcard lockfile patterns", async () => {
      tempFixture = await createEmptyTempDir("lockfile-wildcard");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\n*.lock\ndist\n");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = lockfileNotIgnored.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await tempFixture.readFile(".gitignore");
      expect(content).not.toContain("*.lock");
    });

    it("should pass for healthy project (lockfiles not ignored)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await lockfileNotIgnored.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });

    it("should be idempotent", async () => {
      tempFixture = await createEmptyTempDir("lockfile-idempotent");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeFile(".gitignore", "node_modules\npackage-lock.json\ndist\n");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = lockfileNotIgnored.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);

      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      await fix.run(global2, ctx2);

      const content = await tempFixture.readFile(".gitignore");
      expect(content).toContain("node_modules");
      expect(content).toContain("dist");
      expect(content).not.toContain("package-lock.json");
    });
  });
});
