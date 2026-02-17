import { describe, it, expect } from "vitest";
import { normalize, matchChallenge, matches, createMatcher } from "./typing-challenge.js";

describe("typing-challenge", () => {
  describe("normalize", () => {
    it("should lowercase input", () => {
      expect(normalize("HELLO WORLD")).toBe("hello world");
    });

    it("should trim whitespace", () => {
      expect(normalize("  hello world  ")).toBe("hello world");
    });

    it("should handle combined transformations", () => {
      expect(normalize("  HELLO WORLD  ")).toBe("hello world");
    });

    it("should preserve punctuation and special characters", () => {
      expect(normalize("hello, world!")).toBe("hello, world!");
      expect(normalize("i allow eslint overwriting!")).toBe("i allow eslint overwriting!");
    });

    it("should preserve internal spaces", () => {
      expect(normalize("hello   world")).toBe("hello   world");
    });
  });

  describe("matchChallenge", () => {
    const phrase = "i allow eslint overwriting";

    it("should match exact input", () => {
      const result = matchChallenge(phrase, phrase);
      expect(result.matches).toBe(true);
    });

    it("should match with different casing", () => {
      const result = matchChallenge("I ALLOW ESLINT OVERWRITING", phrase);
      expect(result.matches).toBe(true);
    });

    it("should match with leading/trailing whitespace", () => {
      const result = matchChallenge("  i allow eslint overwriting  ", phrase);
      expect(result.matches).toBe(true);
    });

    it("should NOT match with punctuation", () => {
      const result = matchChallenge("i allow eslint overwriting!", phrase);
      expect(result.matches).toBe(false);
    });

    it("should NOT match with extra internal spaces", () => {
      const result = matchChallenge("i  allow   eslint  overwriting", phrase);
      expect(result.matches).toBe(false);
    });

    it("should NOT match with typos", () => {
      const result = matchChallenge("i alow eslint overwriting", phrase);
      expect(result.matches).toBe(false);
    });

    it("should not match completely wrong input", () => {
      const result = matchChallenge("something completely different", phrase);
      expect(result.matches).toBe(false);
    });

    it("should provide normalized strings in result", () => {
      const result = matchChallenge("  I ALLOW ESLINT OVERWRITING  ", phrase);
      expect(result.normalizedInput).toBe("i allow eslint overwriting");
      expect(result.normalizedExpected).toBe("i allow eslint overwriting");
    });
  });

  describe("matches", () => {
    it("should return boolean for simple checks", () => {
      expect(matches("hello", "hello")).toBe(true);
      expect(matches("HELLO", "hello")).toBe(true);
      expect(matches("hello", "world")).toBe(false);
    });

    it("should require exact character match", () => {
      expect(matches("helo", "hello")).toBe(false);
      expect(matches("hello!", "hello")).toBe(false);
    });
  });

  describe("createMatcher", () => {
    it("should create a reusable matcher function", () => {
      const matcher = createMatcher("confirm action");

      expect(matcher("confirm action")).toBe(true);
      expect(matcher("CONFIRM ACTION")).toBe(true);
      expect(matcher("  confirm action  ")).toBe(true);
      expect(matcher("confrim action")).toBe(false); // typo - no tolerance
      expect(matcher("something else")).toBe(false);
    });

    it("should work for eslint overwriting phrase", () => {
      const matcher = createMatcher("i allow eslint overwriting");

      // Valid inputs
      expect(matcher("i allow eslint overwriting")).toBe(true);
      expect(matcher("I ALLOW ESLINT OVERWRITING")).toBe(true);
      expect(matcher("  i allow eslint overwriting  ")).toBe(true);

      // Invalid inputs - must be exact
      expect(matcher("i allow eslint overwriting!")).toBe(false); // punctuation
      expect(matcher("i  allow eslint overwriting")).toBe(false); // extra space
      expect(matcher("i alow eslint overwriting")).toBe(false); // typo
      expect(matcher("i allow")).toBe(false); // too short
      expect(matcher("no")).toBe(false);
      expect(matcher("")).toBe(false);
    });
  });
});
