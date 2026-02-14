import { describe, it, expect } from "vitest";
import { safeJsonParse, safeJson5Parse, safeMerge, safeMergeRecords } from "./safe-json.js";

describe("safe-json", () => {
  describe("safeJsonParse", () => {
    it("should parse valid JSON", () => {
      const result = safeJsonParse<{ name: string }>('{"name": "test"}');
      expect(result).toEqual({ name: "test" });
    });

    it("should return null for invalid JSON", () => {
      const result = safeJsonParse("invalid json");
      expect(result).toBeNull();
    });

    it("should filter out __proto__ key", () => {
      const result = safeJsonParse<Record<string, unknown>>(
        '{"__proto__": {"admin": true}, "name": "test"}'
      );
      expect(result).toEqual({ name: "test" });
      // Check that __proto__ is not an own property
      expect(Object.prototype.hasOwnProperty.call(result, "__proto__")).toBe(false);
      // Ensure Object.prototype wasn't polluted
      expect(({} as Record<string, unknown>).admin).toBeUndefined();
    });

    it("should filter out constructor key", () => {
      const result = safeJsonParse<Record<string, unknown>>(
        '{"constructor": {"prototype": {"admin": true}}, "name": "test"}'
      );
      expect(result).toEqual({ name: "test" });
    });

    it("should filter out prototype key", () => {
      const result = safeJsonParse<Record<string, unknown>>(
        '{"prototype": {"admin": true}, "name": "test"}'
      );
      expect(result).toEqual({ name: "test" });
    });

    it("should recursively sanitize nested objects", () => {
      const result = safeJsonParse<Record<string, unknown>>(
        '{"nested": {"__proto__": {"admin": true}, "valid": "value"}}'
      );
      expect(result).toEqual({ nested: { valid: "value" } });
    });

    it("should handle arrays", () => {
      const result = safeJsonParse<unknown[]>(
        '[{"__proto__": {"admin": true}, "name": "test"}]'
      );
      expect(result).toEqual([{ name: "test" }]);
    });
  });

  describe("safeJson5Parse", () => {
    it("should parse valid JSON5", () => {
      const result = safeJson5Parse<{ name: string }>("{ name: 'test' }");
      expect(result).toEqual({ name: "test" });
    });

    it("should filter out __proto__ in JSON5", () => {
      const result = safeJson5Parse<Record<string, unknown>>(
        "{ __proto__: { admin: true }, name: 'test' }"
      );
      expect(result).toEqual({ name: "test" });
    });
  });

  describe("safeMerge", () => {
    it("should merge objects", () => {
      const result = safeMerge({ a: 1 }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should filter out __proto__ from overrides", () => {
      const malicious = JSON.parse('{"__proto__": {"admin": true}, "b": 2}');
      const result = safeMerge({ a: 1 }, malicious);
      expect(result).toEqual({ a: 1, b: 2 });
      expect(({} as Record<string, unknown>).admin).toBeUndefined();
    });
  });

  describe("safeMergeRecords", () => {
    it("should merge record objects", () => {
      const result = safeMergeRecords({ a: "1" }, { b: "2" });
      expect(result).toEqual({ a: "1", b: "2" });
    });

    it("should handle undefined base", () => {
      const result = safeMergeRecords(undefined, { b: "2" });
      expect(result).toEqual({ b: "2" });
    });

    it("should handle undefined overrides", () => {
      const result = safeMergeRecords({ a: "1" }, undefined);
      expect(result).toEqual({ a: "1" });
    });

    it("should filter out __proto__ from both", () => {
      const base = JSON.parse('{"__proto__": {"x": 1}, "a": "1"}');
      const overrides = JSON.parse('{"__proto__": {"y": 2}, "b": "2"}');
      const result = safeMergeRecords(base, overrides);
      expect(result).toEqual({ a: "1", b: "2" });
    });
  });
});
