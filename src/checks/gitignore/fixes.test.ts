import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGlobalContext } from "../../context/global.js";
import { loadContext } from "./context.js";
import { check as noDuplicates } from "./no-duplicates/check.js";
import { check as noSecretsCommitted } from "./no-secrets-committed/check.js";

describe("gitignore fixes", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gitignore-fix-test-"));
    // Create a minimal package.json so it's treated as a project
    await writeFile(join(tempDir, "package.json"), JSON.stringify({ name: "test" }));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function createGitignore(content: string) {
    await writeFile(join(tempDir, ".gitignore"), content);
  }

  async function readGitignore(): Promise<string> {
    return readFile(join(tempDir, ".gitignore"), "utf-8");
  }

  describe("no-duplicates fix", () => {
    it("should remove duplicate patterns", async () => {
      await createGitignore(`node_modules
dist
node_modules
.env
dist
`);

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await noDuplicates.run(global, ctx);
      expect(checkResult.status).toBe("fail");
      expect(checkResult.message).toContain("Duplicates");

      // Run fix
      const fix = noDuplicates.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain("2");

      // Verify .gitignore was deduplicated
      const content = await readGitignore();
      const lines = content.split("\n").filter((l) => l.trim());
      expect(lines.filter((l) => l === "node_modules").length).toBe(1);
      expect(lines.filter((l) => l === "dist").length).toBe(1);
      expect(lines.filter((l) => l === ".env").length).toBe(1);

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await noDuplicates.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should preserve comments", async () => {
      await createGitignore(`# Build output
dist
# Dependencies
node_modules
# Duplicates below
dist
node_modules
`);

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noDuplicates.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await readGitignore();
      expect(content).toContain("# Build output");
      expect(content).toContain("# Dependencies");
    });

    it("should preserve empty lines structure", async () => {
      await createGitignore(`node_modules

dist
dist
`);

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noDuplicates.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await readGitignore();
      // Should still have the empty line structure
      expect(content).toContain("node_modules\n\ndist");
    });

    it("should handle trailing whitespace in patterns", async () => {
      await createGitignore(`node_modules
node_modules
dist
`);

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // The context trims patterns, so these are duplicates
      const checkResult = await noDuplicates.run(global, ctx);
      expect(checkResult.status).toBe("fail");
    });
  });

  describe("no-secrets-committed fix", () => {
    it("should add missing secret files to gitignore", async () => {
      // Create a gitignore without .env
      await createGitignore(`node_modules
dist
`);
      // Create a .env file that exists but isn't ignored
      await writeFile(join(tempDir, ".env"), "SECRET=value");

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("fail");
      expect(checkResult.message).toContain(".env");

      // Run fix
      const fix = noSecretsCommitted.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain(".env");

      // Verify .gitignore was updated
      const content = await readGitignore();
      expect(content).toContain(".env");
      expect(content).toContain("# Secret files");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await noSecretsCommitted.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should add multiple missing secret files", async () => {
      await createGitignore(`node_modules
dist
`);
      // Create multiple secret files
      await writeFile(join(tempDir, ".env"), "SECRET=value");
      await writeFile(join(tempDir, ".env.local"), "LOCAL_SECRET=value");
      await writeFile(join(tempDir, ".npmrc"), "//registry.npmjs.org/:_authToken=token");

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const content = await readGitignore();
      expect(content).toContain(".env");
      expect(content).toContain(".env.local");
      expect(content).toContain(".npmrc");
    });

    it("should not add files that don't exist", async () => {
      await createGitignore(`node_modules
dist
`);
      // Only create .env, not .env.local or credentials.json
      await writeFile(join(tempDir, ".env"), "SECRET=value");

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await readGitignore();
      expect(content).toContain(".env");
      // Should not add files that don't exist
      expect(content).not.toContain("credentials.json");
      expect(content).not.toContain("secrets.json");
    });

    it("should not add files already ignored", async () => {
      await createGitignore(`node_modules
dist
.env
`);
      await writeFile(join(tempDir, ".env"), "SECRET=value");

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Check should pass since .env is already ignored
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });

    it("should handle gitignore without trailing newline", async () => {
      await createGitignore("node_modules\ndist"); // No trailing newline
      await writeFile(join(tempDir, ".env"), "SECRET=value");

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await readGitignore();
      // Should properly handle no trailing newline
      expect(content).toContain(".env");
      expect(content).not.toContain("dist.env"); // Should not concatenate
    });

    it("should do nothing if no secret files to add", async () => {
      await createGitignore(`node_modules
dist
.env
.env.local
`);

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain("No secret files to add");
    });
  });

  describe("fix idempotency", () => {
    it("should be safe to run no-duplicates fix twice", async () => {
      await createGitignore(`node_modules
node_modules
dist
`);

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noDuplicates.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);

      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      await fix.run(global2, ctx2);

      const content = await readGitignore();
      const nodeModulesCount = content.split("\n").filter((l) => l.trim() === "node_modules").length;
      expect(nodeModulesCount).toBe(1);
    });

    it("should be safe to run secrets fix twice", async () => {
      await createGitignore(`node_modules
dist
`);
      await writeFile(join(tempDir, ".env"), "SECRET=value");

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = noSecretsCommitted.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);

      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const result = await fix.run(global2, ctx2);

      // Second run should report nothing to add
      expect(result.message).toContain("No secret files to add");
    });
  });

  describe("wildcard pattern matching", () => {
    it("should recognize wildcard patterns that cover secret files", async () => {
      await createGitignore(`node_modules
dist
.env*
`);
      await writeFile(join(tempDir, ".env"), "SECRET=value");
      await writeFile(join(tempDir, ".env.local"), "LOCAL=value");

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Check should pass since .env* pattern covers both files
      const checkResult = await noSecretsCommitted.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });
});
