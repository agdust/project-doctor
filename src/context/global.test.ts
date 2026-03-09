import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createGlobalContext } from "./global.js";

describe("createGlobalContext", () => {
  let tempDir: string;

  async function setup(): Promise<string> {
    tempDir = await mkdtemp(path.join(tmpdir(), "global-ctx-test-"));
    return tempDir;
  }

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should create context for a JS project", async () => {
    const dir = await setup();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "test-project", version: "1.0.0" }),
    );

    const ctx = await createGlobalContext(dir);

    expect(ctx.projectPath).toBe(dir);
    expect(ctx.config.projectType).toBe("js");
    expect(ctx.config.projectTypeSource).toBe("detected");
    expect(ctx.detected).toBeDefined();
    expect(ctx.files).toBeDefined();
  });

  it("should create context for a generic project", async () => {
    const dir = await setup();
    // No JS indicator files

    const ctx = await createGlobalContext(dir);

    expect(ctx.config.projectType).toBe("generic");
  });

  it("should skip config when skipConfig is true", async () => {
    const dir = await setup();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "test-project" }));

    // Create config that disables a check
    await mkdir(path.join(dir, ".project-doctor"), { recursive: true });
    await writeFile(
      path.join(dir, ".project-doctor", "config.json5"),
      '{ checks: { "some-check": "off" } }',
    );

    const ctx = await createGlobalContext(dir, { skipConfig: true });

    // When skipping config, checks should be defaults (empty)
    expect(ctx.config.checks).toEqual({});
  });

  it("should apply config overrides", async () => {
    const dir = await setup();
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "test-project" }));

    const ctx = await createGlobalContext(dir, {
      configOverrides: {
        tags: { opinionated: "off" },
      },
    });

    expect(ctx.config.tags.opinionated).toBe("off");
  });

  it("should detect tools from project files", async () => {
    const dir = await setup();
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "test",
        devDependencies: { typescript: "^5.0", eslint: "^9.0" },
      }),
    );
    await writeFile(path.join(dir, "tsconfig.json"), "{}");

    const ctx = await createGlobalContext(dir);

    expect(ctx.detected.hasTypeScript).toBe(true);
    expect(ctx.detected.hasEslint).toBe(true);
  });

  it("should provide a working file cache", async () => {
    const dir = await setup();
    await writeFile(path.join(dir, "test.txt"), "hello");
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "test" }));

    const ctx = await createGlobalContext(dir);

    expect(await ctx.files.readText("test.txt")).toBe("hello");
    expect(await ctx.files.exists("test.txt")).toBe(true);
    expect(await ctx.files.exists("nonexistent.txt")).toBe(false);
  });
});
