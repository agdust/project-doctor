import { describe, it, expect } from "vitest";
import {
  normalize,
  levenshteinDistance,
  isWithinDistance,
  matchChallenge,
  matches,
  createMatcher,
} from "./typing-challenge.js";

describe("typing-challenge", () => {
  describe("normalize", () => {
    it("should lowercase input", () => {
      expect(normalize("HELLO WORLD")).toBe("hello world");
    });

    it("should remove punctuation", () => {
      expect(normalize("hello, world!")).toBe("hello world");
      expect(normalize("i allow eslint overwriting!")).toBe("i allow eslint overwriting");
    });

    it("should collapse multiple spaces", () => {
      expect(normalize("hello   world")).toBe("hello world");
      expect(normalize("i  allow   eslint    overwriting")).toBe("i allow eslint overwriting");
    });

    it("should trim whitespace", () => {
      expect(normalize("  hello world  ")).toBe("hello world");
    });

    it("should handle combined transformations", () => {
      expect(normalize("  HELLO,   WORLD!  ")).toBe("hello world");
      expect(normalize("I ALLOW ESLINT OVERWRITING!!!")).toBe("i allow eslint overwriting");
    });

    it("should keep numbers", () => {
      expect(normalize("hello 123 world")).toBe("hello 123 world");
    });
  });

  describe("levenshteinDistance", () => {
    it("should return 0 for identical strings", () => {
      expect(levenshteinDistance("hello", "hello")).toBe(0);
      expect(levenshteinDistance("", "")).toBe(0);
    });

    it("should return length for empty string comparison", () => {
      expect(levenshteinDistance("hello", "")).toBe(5);
      expect(levenshteinDistance("", "world")).toBe(5);
    });

    it("should count single character substitutions", () => {
      expect(levenshteinDistance("cat", "bat")).toBe(1);
      expect(levenshteinDistance("cat", "car")).toBe(1);
    });

    it("should count single character insertions", () => {
      expect(levenshteinDistance("cat", "cats")).toBe(1);
      expect(levenshteinDistance("helo", "hello")).toBe(1);
    });

    it("should count single character deletions", () => {
      expect(levenshteinDistance("cats", "cat")).toBe(1);
      expect(levenshteinDistance("hello", "helo")).toBe(1);
    });

    it("should handle multiple edits", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
      expect(levenshteinDistance("saturday", "sunday")).toBe(3);
    });

    it("should be symmetric", () => {
      expect(levenshteinDistance("abc", "def")).toBe(levenshteinDistance("def", "abc"));
      expect(levenshteinDistance("hello", "helo")).toBe(levenshteinDistance("helo", "hello"));
    });
  });

  describe("isWithinDistance", () => {
    it("should return true when within threshold", () => {
      expect(isWithinDistance("hello", "helo", 1)).toBe(true);
      expect(isWithinDistance("hello", "hello", 0)).toBe(true);
    });

    it("should return false when exceeding threshold", () => {
      expect(isWithinDistance("hello", "world", 2)).toBe(false);
      expect(isWithinDistance("cat", "dog", 2)).toBe(false);
    });
  });

  describe("matchChallenge", () => {
    const phrase = "i allow eslint overwriting";

    it("should match exact input", () => {
      const result = matchChallenge(phrase, phrase);
      expect(result.matches).toBe(true);
      expect(result.typos).toBe(0);
    });

    it("should match with different casing", () => {
      const result = matchChallenge("I ALLOW ESLINT OVERWRITING", phrase);
      expect(result.matches).toBe(true);
      expect(result.typos).toBe(0);
    });

    it("should match with punctuation", () => {
      const result = matchChallenge("i allow eslint overwriting!", phrase);
      expect(result.matches).toBe(true);
      expect(result.typos).toBe(0);
    });

    it("should match with extra spaces", () => {
      const result = matchChallenge("i  allow   eslint  overwriting", phrase);
      expect(result.matches).toBe(true);
      expect(result.typos).toBe(0);
    });

    it("should match with typos within tolerance", () => {
      // 1 typo: "alow" instead of "allow"
      const result1 = matchChallenge("i alow eslint overwriting", phrase, { maxTypos: 3 });
      expect(result1.matches).toBe(true);
      expect(result1.typos).toBe(1);

      // 2 typos
      const result2 = matchChallenge("i alow eslit overwriting", phrase, { maxTypos: 3 });
      expect(result2.matches).toBe(true);
      expect(result2.typos).toBe(2);

      // 3 typos
      const result3 = matchChallenge("i alow eslit overwrting", phrase, { maxTypos: 3 });
      expect(result3.matches).toBe(true);
      expect(result3.typos).toBe(3);
    });

    it("should not match with too many typos", () => {
      // 4+ typos should fail with maxTypos: 3
      const result = matchChallenge("i alow eslit overwrting x", phrase, { maxTypos: 3 });
      expect(result.matches).toBe(false);
      expect(result.typos).toBeGreaterThan(3);
    });

    it("should not match completely wrong input", () => {
      const result = matchChallenge("something completely different", phrase);
      expect(result.matches).toBe(false);
    });

    it("should provide normalized strings in result", () => {
      const result = matchChallenge("I ALLOW ESLINT OVERWRITING!", phrase);
      expect(result.normalizedInput).toBe("i allow eslint overwriting");
      expect(result.normalizedExpected).toBe("i allow eslint overwriting");
    });
  });

  describe("matches", () => {
    it("should return boolean for simple checks", () => {
      expect(matches("hello", "hello")).toBe(true);
      expect(matches("hello", "world")).toBe(false);
    });

    it("should respect maxTypos option", () => {
      expect(matches("helo", "hello", { maxTypos: 1 })).toBe(true);
      expect(matches("helo", "hello", { maxTypos: 0 })).toBe(false);
    });
  });

  describe("createMatcher", () => {
    it("should create a reusable matcher function", () => {
      const matcher = createMatcher("confirm action", { maxTypos: 2 });

      expect(matcher("confirm action")).toBe(true);
      expect(matcher("CONFIRM ACTION")).toBe(true);
      expect(matcher("confrim action")).toBe(true); // 1 typo
      expect(matcher("something else")).toBe(false);
    });

    it("should work for eslint overwriting phrase", () => {
      const matcher = createMatcher("i allow eslint overwriting", { maxTypos: 3 });

      // Valid inputs
      expect(matcher("i allow eslint overwriting")).toBe(true);
      expect(matcher("I ALLOW ESLINT OVERWRITING")).toBe(true);
      expect(matcher("i allow eslint overwriting!")).toBe(true);
      expect(matcher("i  allow   eslint  overwriting")).toBe(true);
      expect(matcher("i alow eslint overwriting")).toBe(true); // 1 typo
      expect(matcher("i alow eslit overwriting")).toBe(true); // 2 typos
      expect(matcher("i alow eslit overwrting")).toBe(true); // 3 typos

      // Invalid inputs
      expect(matcher("i allow")).toBe(false); // too short
      expect(matcher("no")).toBe(false);
      expect(matcher("")).toBe(false);
    });
  });
});
