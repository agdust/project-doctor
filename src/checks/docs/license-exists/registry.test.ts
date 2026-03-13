import { describe, it, expect } from "vitest";
import { findBySpdxId, licenseRegistry } from "./registry.js";

describe("license registry", () => {
  describe("findBySpdxId", () => {
    it("should find by exact SPDX ID", () => {
      const entry = findBySpdxId("MIT");
      expect(entry).toBeDefined();
      expect(entry!.spdxId).toBe("MIT");
    });

    it("should find by alias", () => {
      const entry = findBySpdxId("GPL-3.0");
      expect(entry).toBeDefined();
      expect(entry!.spdxId).toBe("GPL-3.0-or-later");
    });

    it("should be case-insensitive", () => {
      expect(findBySpdxId("mit")).toBeDefined();
      expect(findBySpdxId("Mit")).toBeDefined();
      expect(findBySpdxId("gpl-3.0-or-later")).toBeDefined();
      expect(findBySpdxId("cc0")).toBeDefined();
    });

    it("should return undefined for unknown IDs", () => {
      expect(findBySpdxId("Apache-2.0")).toBeUndefined();
      expect(findBySpdxId("")).toBeUndefined();
      expect(findBySpdxId("not-a-license")).toBeUndefined();
    });

    it("should have requiresCopyrightHolder set correctly", () => {
      expect(findBySpdxId("MIT")!.requiresCopyrightHolder).toBe(true);
      expect(findBySpdxId("GPL-3.0-or-later")!.requiresCopyrightHolder).toBe(false);
      expect(findBySpdxId("CC0-1.0")!.requiresCopyrightHolder).toBe(false);
      expect(findBySpdxId("UNLICENSED")!.requiresCopyrightHolder).toBe(true);
    });
  });

  it("should have unique SPDX IDs", () => {
    const ids = licenseRegistry.map((e) => e.spdxId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have templateFile for every entry", () => {
    for (const entry of licenseRegistry) {
      expect(entry.templateFile).toBeTruthy();
    }
  });
});
