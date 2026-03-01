import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractSeverity,
  extractCheckOptions,
  isSkipUntil,
  parseSkipUntil,
  isSkipUntilActive,
  createSkipUntil,
} from "./types.js";

describe("config types", () => {
  describe("extractSeverity", () => {
    it("should return undefined for undefined input", () => {
      expect(extractSeverity(undefined)).toBeUndefined();
    });

    it("should return plain severity as-is", () => {
      expect(extractSeverity("off")).toBe("off");
      expect(extractSeverity("error")).toBe("error");
      expect(extractSeverity("skip-until-2025-06-01")).toBe("skip-until-2025-06-01");
    });

    it("should extract severity from tuple", () => {
      expect(extractSeverity(["off", { key: "value" }])).toBe("off");
      expect(extractSeverity(["error", { exceptions: [] }])).toBe("error");
      expect(extractSeverity(["skip-until-2025-06-01", {}])).toBe("skip-until-2025-06-01");
    });
  });

  describe("extractCheckOptions", () => {
    it("should return undefined for plain severity", () => {
      expect(extractCheckOptions("off")).toBeUndefined();
      expect(extractCheckOptions("error")).toBeUndefined();
      expect(extractCheckOptions(undefined)).toBeUndefined();
    });

    it("should return options from tuple", () => {
      const options = { exceptions: ["foo"] };
      expect(extractCheckOptions(["error", options])).toEqual(options);
    });

    it("should return empty object from tuple with empty options", () => {
      expect(extractCheckOptions(["off", {}])).toEqual({});
    });
  });

  describe("isSkipUntil", () => {
    it("should return true for valid skip-until strings", () => {
      expect(isSkipUntil("skip-until-2025-06-01")).toBe(true);
      expect(isSkipUntil("skip-until-2030-12-31")).toBe(true);
    });

    it("should return false for non-skip-until strings", () => {
      expect(isSkipUntil("off")).toBe(false);
      expect(isSkipUntil("error")).toBe(false);
      expect(isSkipUntil("skip-")).toBe(false);
      expect(isSkipUntil("")).toBe(false);
    });
  });

  describe("parseSkipUntil", () => {
    it("should parse valid skip-until dates", () => {
      const date = parseSkipUntil("skip-until-2025-06-01");
      expect(date).not.toBeNull();
      expect(date!.getUTCFullYear()).toBe(2025);
      expect(date!.getUTCMonth()).toBe(5); // June = 5
      expect(date!.getUTCDate()).toBe(1);
    });

    it("should return null for non-skip-until strings", () => {
      expect(parseSkipUntil("off")).toBeNull();
      expect(parseSkipUntil("error")).toBeNull();
      expect(parseSkipUntil("some-random-string")).toBeNull();
    });

    it("should return null for invalid date formats", () => {
      // Not zero-padded
      expect(parseSkipUntil("skip-until-2025-2-1")).toBeNull();
      // Invalid month
      expect(parseSkipUntil("skip-until-2025-13-01")).toBeNull();
      // Invalid day
      expect(parseSkipUntil("skip-until-2025-02-30")).toBeNull();
      // Incomplete date
      expect(parseSkipUntil("skip-until-2025-06")).toBeNull();
      // Extra content
      expect(parseSkipUntil("skip-until-2025-06-01-extra")).toBeNull();
    });

    it("should return null for invalid calendar dates", () => {
      // Feb 30 doesn't exist
      expect(parseSkipUntil("skip-until-2025-02-30")).toBeNull();
      // April 31 doesn't exist
      expect(parseSkipUntil("skip-until-2025-04-31")).toBeNull();
    });
  });

  describe("isSkipUntilActive", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for a future date", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      expect(isSkipUntilActive("skip-until-2025-06-01")).toBe(true);
    });

    it("should return false for a past date", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      expect(isSkipUntilActive("skip-until-2025-06-01")).toBe(false);
    });

    it("should return false for a date more than 3 years in the future", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      expect(isSkipUntilActive("skip-until-2029-01-01")).toBe(false);
    });

    it("should return false for invalid skip-until values", () => {
      expect(isSkipUntilActive("off")).toBe(false);
      expect(isSkipUntilActive("error")).toBe(false);
      expect(isSkipUntilActive("skip-until-invalid")).toBe(false);
    });

    it("should return true on the exact skip-until date (end of day)", () => {
      // The date is set to end-of-day UTC (23:59:59.999)
      vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
      expect(isSkipUntilActive("skip-until-2025-06-01")).toBe(true);
    });
  });

  describe("createSkipUntil", () => {
    it("should create skip-until with zero-padded month and day", () => {
      const date = new Date(2025, 0, 5); // Jan 5
      expect(createSkipUntil(date)).toBe("skip-until-2025-01-05");
    });

    it("should handle double-digit month and day", () => {
      const date = new Date(2025, 11, 25); // Dec 25
      expect(createSkipUntil(date)).toBe("skip-until-2025-12-25");
    });

    it("should produce a string that passes isSkipUntil", () => {
      const date = new Date(2025, 5, 15);
      const result = createSkipUntil(date);
      expect(isSkipUntil(result)).toBe(true);
    });

    it("should produce a string parseable by parseSkipUntil", () => {
      const date = new Date(2025, 5, 15);
      const result = createSkipUntil(date);
      const parsed = parseSkipUntil(result);
      expect(parsed).not.toBeNull();
      expect(parsed!.getUTCFullYear()).toBe(2025);
      expect(parsed!.getUTCMonth()).toBe(5);
      expect(parsed!.getUTCDate()).toBe(15);
    });
  });
});
