import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fixtures } from "./test/fixtures.js";

const execAsync = promisify(exec);

const CLI = "node ./dist/cli.js";

async function runCli(args: string): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execAsync(`${CLI} ${args}`);
    return { stdout, stderr, code: 0 };
  } catch (error) {
    const e = error as { stdout: string; stderr: string; code: number };
    return { stdout: e.stdout || "", stderr: e.stderr || "", code: e.code || 1 };
  }
}

describe("CLI", () => {
  describe("--help", () => {
    it("should display help text", async () => {
      const { stdout, code } = await runCli("--help");

      expect(code).toBe(0);
      expect(stdout).toContain("project-doctor");
      expect(stdout).toContain("Commands:");
      expect(stdout).toContain("check");
      expect(stdout).toContain("fix");
      expect(stdout).toContain("deps");
    });
  });

  describe("--version", () => {
    it("should display version", async () => {
      const { stdout, code } = await runCli("--version");

      expect(code).toBe(0);
      expect(stdout).toContain("project-doctor");
    });
  });

  describe("--list", () => {
    it("should list available checks", async () => {
      const { stdout, code } = await runCli("--list");

      expect(code).toBe(0);
      expect(stdout).toContain("Available checks");
      expect(stdout).toContain("package-json");
    });
  });

  describe("check command", () => {
    it("should run checks and show results", async () => {
      const { stdout } = await runCli(`check ${fixtures.healthy}`);

      expect(stdout).toContain("passed");
      expect(stdout).toContain("Summary");
    });

    it("should exit with code 1 when checks fail", async () => {
      const { stdout, code } = await runCli(`check ${fixtures.broken}`);

      expect(code).toBe(1);
      expect(stdout).toContain("failed");
    });

    it("should filter by group", async () => {
      const { stdout } = await runCli(`check -g package-json ${fixtures.healthy}`);

      expect(stdout).toContain("package-json");
    });

    it("should pass when filtering to passing group", async () => {
      const { stdout, code } = await runCli(`check -g gitignore ${fixtures.healthy}`);

      expect(code).toBe(0);
      expect(stdout).toContain("passed");
    });
  });

  describe("overview (default)", () => {
    it("should show overview for healthy project", async () => {
      const { stdout, code } = await runCli(fixtures.healthy);

      expect(code).toBe(0);
      expect(stdout).toContain("healthy-project");
    });
  });

  describe("init command", () => {
    const testDir = "/tmp/test-init-project";

    beforeEach(async () => {
      await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      await rm(testDir, { recursive: true, force: true });
    });

    it("should create config file", async () => {
      const { stdout, code } = await runCli(`init ${testDir}`);

      expect(code).toBe(0);
      expect(stdout).toContain("Created");
      expect(stdout).toContain("config.json5");
    });

    it("should warn if config already exists", async () => {
      await mkdir(join(testDir, ".project-doctor"), { recursive: true });
      await writeFile(join(testDir, ".project-doctor", "config.json5"), "{}", "utf-8");

      const { stdout, code } = await runCli(`init ${testDir}`);

      expect(code).toBe(0);
      expect(stdout).toContain("already exists");
    });
  });

  describe("snapshot command", () => {
    const testDir = "/tmp/test-snapshot-project";

    beforeEach(async () => {
      await mkdir(testDir, { recursive: true });
      await writeFile(join(testDir, "package.json"), '{"name": "test"}', "utf-8");
    });

    afterEach(async () => {
      await rm(testDir, { recursive: true, force: true });
    });

    it("should save snapshot", async () => {
      const { stdout, code } = await runCli(`snapshot ${testDir}`);

      expect(code).toBe(0);
      expect(stdout).toContain("Snapshot saved");
    });
  });

  describe("history command", () => {
    it("should show no history message for new project", async () => {
      const testDir = "/tmp/test-history-project";
      await mkdir(testDir, { recursive: true });

      const { stdout, code } = await runCli(`history ${testDir}`);

      expect(code).toBe(0);
      expect(stdout).toContain("No snapshots");

      await rm(testDir, { recursive: true, force: true });
    });
  });
});
