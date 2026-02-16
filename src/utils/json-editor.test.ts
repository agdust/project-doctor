import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readJson, writeJson, updateJson, setNestedField } from "./json-editor.js";

describe("json-editor", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "json-editor-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("readJson", () => {
    it("should read and parse JSON file", async () => {
      await writeFile(join(tempDir, "test.json"), '{"name": "test"}');
      const result = await readJson<{ name: string }>(tempDir, "test.json");
      expect(result).toEqual({ name: "test" });
    });

    it("should return null for non-existent file", async () => {
      const result = await readJson(tempDir, "missing.json");
      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", async () => {
      await writeFile(join(tempDir, "invalid.json"), "not json");
      const result = await readJson(tempDir, "invalid.json");
      expect(result).toBeNull();
    });
  });

  describe("writeJson", () => {
    it("should write JSON with 2-space indentation and trailing newline", async () => {
      await writeJson(tempDir, "out.json", { name: "test", version: "1.0.0" });
      const content = await readFile(join(tempDir, "out.json"), "utf-8");
      expect(content).toBe('{\n  "name": "test",\n  "version": "1.0.0"\n}\n');
    });
  });

  describe("updateJson", () => {
    it("should update existing JSON file", async () => {
      await writeFile(join(tempDir, "pkg.json"), '{"name": "old"}');
      const result = await updateJson<{ name: string }>(tempDir, "pkg.json", (data) => ({
        ...data,
        name: "new",
      }));
      expect(result.success).toBe(true);
      const updated = await readJson<{ name: string }>(tempDir, "pkg.json");
      expect(updated?.name).toBe("new");
    });

    it("should fail for non-existent file", async () => {
      const result = await updateJson(tempDir, "missing.json", (data) => data);
      expect(result.success).toBe(false);
    });
  });

  describe("setNestedField", () => {
    it("should set top-level field", () => {
      const obj = { a: 1 };
      setNestedField(obj, "b", 2);
      expect(obj).toEqual({ a: 1, b: 2 });
    });

    it("should set nested field", () => {
      const obj: Record<string, unknown> = {};
      setNestedField(obj, "a.b.c", "value");
      expect(obj).toEqual({ a: { b: { c: "value" } } });
    });

    it("should create intermediate objects", () => {
      const obj: Record<string, unknown> = { existing: true };
      setNestedField(obj, "engines.node", ">=20");
      expect(obj).toEqual({ existing: true, engines: { node: ">=20" } });
    });

    it("should overwrite existing nested field", () => {
      const obj = { compilerOptions: { strict: false } };
      setNestedField(obj, "compilerOptions.strict", true);
      expect(obj.compilerOptions.strict).toBe(true);
    });
  });
});
