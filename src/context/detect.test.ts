import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { detectTools } from "./detect.js";
import { createFileCache } from "./file-cache.js";

describe("detectTools", () => {
  let tempDir: string;

  async function setup(): Promise<string> {
    tempDir = await mkdtemp(path.join(tmpdir(), "detect-test-"));
    return tempDir;
  }

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should return all false/null for empty project", async () => {
    const dir = await setup();
    const files = await createFileCache(dir);
    const tools = await detectTools(files);

    expect(tools.packageManager).toBeNull();
    expect(tools.hasTypeScript).toBe(false);
    expect(tools.hasEslint).toBe(false);
    expect(tools.hasPrettier).toBe(false);
    expect(tools.hasDocker).toBe(false);
    expect(tools.hasKnip).toBe(false);
    expect(tools.hasSizeLimit).toBe(false);
    expect(tools.hasJscpd).toBe(false);
    expect(tools.isMonorepo).toBe(false);
  });

  describe("package manager detection", () => {
    it("should detect npm from package-lock.json", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "package-lock.json"), "{}");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.packageManager).toBe("npm");
    });

    it("should detect yarn from yarn.lock", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "yarn.lock"), "");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.packageManager).toBe("yarn");
    });

    it("should detect pnpm from pnpm-lock.yaml", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "pnpm-lock.yaml"), "");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.packageManager).toBe("pnpm");
    });

    it("should prioritize pnpm over yarn and npm", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "package-lock.json"), "{}");
      await writeFile(path.join(dir, "yarn.lock"), "");
      await writeFile(path.join(dir, "pnpm-lock.yaml"), "");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.packageManager).toBe("pnpm");
    });
  });

  describe("TypeScript detection", () => {
    it("should detect from tsconfig.json", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "tsconfig.json"), "{}");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasTypeScript).toBe(true);
    });

    it("should detect from package.json dependencies", async () => {
      const dir = await setup();
      await writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ devDependencies: { typescript: "^5.0" } }),
      );

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasTypeScript).toBe(true);
    });
  });

  describe("ESLint detection", () => {
    it("should detect from eslint.config.js", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "eslint.config.js"), "");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasEslint).toBe(true);
    });

    it("should detect from .eslintrc.json", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, ".eslintrc.json"), "{}");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasEslint).toBe(true);
    });

    it("should detect from package.json dependencies", async () => {
      const dir = await setup();
      await writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ devDependencies: { eslint: "^9.0" } }),
      );

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasEslint).toBe(true);
    });
  });

  describe("Prettier detection", () => {
    it("should detect from .prettierrc", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, ".prettierrc"), "{}");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasPrettier).toBe(true);
    });

    it("should detect from package.json dependencies", async () => {
      const dir = await setup();
      await writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ dependencies: { prettier: "^3.0" } }),
      );

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasPrettier).toBe(true);
    });
  });

  describe("other tool detection", () => {
    it("should detect Docker from Dockerfile", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "Dockerfile"), "FROM node:20");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasDocker).toBe(true);
    });

    it("should detect knip from package.json", async () => {
      const dir = await setup();
      await writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ devDependencies: { knip: "^5.0" } }),
      );

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasKnip).toBe(true);
    });

    it("should detect size-limit from package.json", async () => {
      const dir = await setup();
      await writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ devDependencies: { "size-limit": "^11.0" } }),
      );

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasSizeLimit).toBe(true);
    });

    it("should detect monorepo from workspaces", async () => {
      const dir = await setup();
      await writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ workspaces: ["packages/*"] }),
      );

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.isMonorepo).toBe(true);
    });

    it("should detect jscpd from .jscpd.json", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, ".jscpd.json"), "{}");

      const files = await createFileCache(dir);
      const tools = await detectTools(files);
      expect(tools.hasJscpd).toBe(true);
    });
  });
});
