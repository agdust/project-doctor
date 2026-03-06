import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractSeverity,
  extractCheckOptions,
  isMuteUntil,
  parseMuteUntil,
  isMuteUntilActive,
  createMuteUntil,
} from "./severity.js";

describe("config types", () => {
  describe("extractSeverity", () => {
    it("should return undefined for undefined input", () => {
      expect(extractSeverity(undefined)).toBeUndefined();
    });

    it("should return plain severity as-is", () => {
      expect(extractSeverity("off")).toBe("off");
      expect(extractSeverity("error")).toBe("error");
      expect(extractSeverity("mute-until-2025-06-01")).toBe("mute-until-2025-06-01");
    });

    it("should extract severity from tuple", () => {
      expect(extractSeverity(["off", { key: "value" }])).toBe("off");
      expect(extractSeverity(["error", { exceptions: [] }])).toBe("error");
      expect(extractSeverity(["mute-until-2025-06-01", {}])).toBe("mute-until-2025-06-01");
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

  describe("isMuteUntil", () => {
    it("should return true for valid mute-until strings", () => {
      expect(isMuteUntil("mute-until-2025-06-01")).toBe(true);
      expect(isMuteUntil("mute-until-2030-12-31")).toBe(true);
    });

    it("should return false for non-mute-until strings", () => {
      expect(isMuteUntil("off")).toBe(false);
      expect(isMuteUntil("error")).toBe(false);
      expect(isMuteUntil("mute-")).toBe(false);
      expect(isMuteUntil("")).toBe(false);
    });
  });

  describe("parseMuteUntil", () => {
    it("should parse valid mute-until dates", () => {
      const date = parseMuteUntil("mute-until-2025-06-01");
      expect(date).not.toBeNull();
      expect(date!.getUTCFullYear()).toBe(2025);
      expect(date!.getUTCMonth()).toBe(5); // June = 5
      expect(date!.getUTCDate()).toBe(1);
    });

    it("should return null for non-mute-until strings", () => {
      expect(parseMuteUntil("off")).toBeNull();
      expect(parseMuteUntil("error")).toBeNull();
      expect(parseMuteUntil("some-random-string")).toBeNull();
    });

    it("should return null for invalid date formats", () => {
      // Not zero-padded
      expect(parseMuteUntil("mute-until-2025-2-1")).toBeNull();
      // Invalid month
      expect(parseMuteUntil("mute-until-2025-13-01")).toBeNull();
      // Invalid day
      expect(parseMuteUntil("mute-until-2025-02-30")).toBeNull();
      // Incomplete date
      expect(parseMuteUntil("mute-until-2025-06")).toBeNull();
      // Extra content
      expect(parseMuteUntil("mute-until-2025-06-01-extra")).toBeNull();
    });

    it("should return null for invalid calendar dates", () => {
      // Feb 30 doesn't exist
      expect(parseMuteUntil("mute-until-2025-02-30")).toBeNull();
      // April 31 doesn't exist
      expect(parseMuteUntil("mute-until-2025-04-31")).toBeNull();
    });
  });

  describe("isMuteUntilActive", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for a future date", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      expect(isMuteUntilActive("mute-until-2025-06-01")).toBe(true);
    });

    it("should return false for a past date", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      expect(isMuteUntilActive("mute-until-2025-06-01")).toBe(false);
    });

    it("should return false for a date more than 3 years in the future", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      expect(isMuteUntilActive("mute-until-2029-01-01")).toBe(false);
    });

    it("should return false for invalid mute-until values", () => {
      expect(isMuteUntilActive("off")).toBe(false);
      expect(isMuteUntilActive("error")).toBe(false);
      expect(isMuteUntilActive("mute-until-invalid")).toBe(false);
    });

    it("should return true on the exact mute-until date (end of day)", () => {
      // The date is set to end-of-day UTC (23:59:59.999)
      vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
      expect(isMuteUntilActive("mute-until-2025-06-01")).toBe(true);
    });
  });

  describe("createMuteUntil", () => {
    it("should create mute-until with zero-padded month and day", () => {
      const date = new Date(2025, 0, 5); // Jan 5
      expect(createMuteUntil(date)).toBe("mute-until-2025-01-05");
    });

    it("should handle double-digit month and day", () => {
      const date = new Date(2025, 11, 25); // Dec 25
      expect(createMuteUntil(date)).toBe("mute-until-2025-12-25");
    });

    it("should produce a string that passes isMuteUntil", () => {
      const date = new Date(2025, 5, 15);
      const result = createMuteUntil(date);
      expect(isMuteUntil(result)).toBe(true);
    });

    it("should produce a string parseable by parseMuteUntil", () => {
      const date = new Date(2025, 5, 15);
      const result = createMuteUntil(date);
      const parsed = parseMuteUntil(result);
      expect(parsed).not.toBeNull();
      expect(parsed!.getUTCFullYear()).toBe(2025);
      expect(parsed!.getUTCMonth()).toBe(5);
      expect(parsed!.getUTCDate()).toBe(15);
    });
  });
});
