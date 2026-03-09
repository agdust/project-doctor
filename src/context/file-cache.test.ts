import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, writeFile, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createFileCache } from "./file-cache.js";

describe("createFileCache", () => {
  let tempDir: string;

  async function setup(): Promise<string> {
    tempDir = await mkdtemp(path.join(tmpdir(), "file-cache-test-"));
    return tempDir;
  }

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe("readText", () => {
    it("should read a text file", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "test.txt"), "hello world");

      const cache = await createFileCache(dir);
      const content = await cache.readText("test.txt");
      expect(content).toBe("hello world");
    });

    it("should return null for non-existent file", async () => {
      const dir = await setup();
      const cache = await createFileCache(dir);
      const content = await cache.readText("nonexistent.txt");
      expect(content).toBeNull();
    });

    it("should cache results", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "test.txt"), "hello");

      const cache = await createFileCache(dir);
      const first = await cache.readText("test.txt");
      const second = await cache.readText("test.txt");
      expect(first).toBe("hello");
      expect(second).toBe("hello");
    });
  });

  describe("readJson", () => {
    it("should parse a JSON file", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "data.json"), '{"name":"test","version":"1.0"}');

      const cache = await createFileCache(dir);
      const data = await cache.readJson<{ name: string; version: string }>("data.json");
      expect(data).toEqual({ name: "test", version: "1.0" });
    });

    it("should return null for invalid JSON", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "bad.json"), "not json{{{");

      const cache = await createFileCache(dir);
      const data = await cache.readJson("bad.json");
      expect(data).toBeNull();
    });

    it("should return null for non-existent file", async () => {
      const dir = await setup();
      const cache = await createFileCache(dir);
      const data = await cache.readJson("missing.json");
      expect(data).toBeNull();
    });

    it("should cache JSON results", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "data.json"), '{"key":"value"}');

      const cache = await createFileCache(dir);
      const first = await cache.readJson("data.json");
      const second = await cache.readJson("data.json");
      expect(first).toEqual({ key: "value" });
      expect(second).toEqual({ key: "value" });
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "exists.txt"), "content");

      const cache = await createFileCache(dir);
      expect(await cache.exists("exists.txt")).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const dir = await setup();
      const cache = await createFileCache(dir);
      expect(await cache.exists("nope.txt")).toBe(false);
    });

    it("should return true for existing directory", async () => {
      const dir = await setup();
      await mkdir(path.join(dir, "subdir"));

      const cache = await createFileCache(dir);
      expect(await cache.exists("subdir")).toBe(true);
    });

    it("should cache existence results", async () => {
      const dir = await setup();
      await writeFile(path.join(dir, "file.txt"), "");

      const cache = await createFileCache(dir);
      const first = await cache.exists("file.txt");
      const second = await cache.exists("file.txt");
      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  });

  describe("path traversal prevention", () => {
    it("should reject .. path traversal in readText", async () => {
      const dir = await setup();
      const cache = await createFileCache(dir);

      // Path traversal should return null (error is caught internally)
      const content = await cache.readText("../../../etc/passwd");
      expect(content).toBeNull();
    });

    it("should reject .. path traversal in exists", async () => {
      const dir = await setup();
      const cache = await createFileCache(dir);

      const result = await cache.exists("../../../etc/passwd");
      expect(result).toBe(false);
    });

    it("should reject .. path traversal in readJson", async () => {
      const dir = await setup();
      const cache = await createFileCache(dir);

      const result = await cache.readJson("../../package.json");
      expect(result).toBeNull();
    });

    it("should allow nested relative paths within project", async () => {
      const dir = await setup();
      await mkdir(path.join(dir, "sub", "dir"), { recursive: true });
      await writeFile(path.join(dir, "sub", "dir", "file.txt"), "nested content");

      const cache = await createFileCache(dir);
      const content = await cache.readText("sub/dir/file.txt");
      expect(content).toBe("nested content");
    });

    it("should reject symlink-based path traversal", async () => {
      const dir = await setup();

      try {
        // Create a symlink pointing outside the project
        await symlink("/tmp", path.join(dir, "escape-link"));
      } catch {
        // Symlink creation may fail in some environments — skip test
        return;
      }

      const cache = await createFileCache(dir);
      // Reading through the symlink should be blocked or return null
      const content = await cache.readText("escape-link/some-file");
      expect(content).toBeNull();
    });
  });
});
