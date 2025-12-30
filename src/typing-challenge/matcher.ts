/**
 * Typing Challenge - Matcher
 *
 * Combines normalization and distance calculation to determine
 * if user input matches an expected phrase with typo tolerance.
 */

import { normalize } from "./normalize.js";
import { levenshteinDistance } from "./distance.js";
import { DEFAULT_MATCH_OPTIONS, type MatchOptions, type MatchResult } from "./types.js";

/**
 * Check if user input matches the expected phrase
 *
 * @param input User's typed input
 * @param expected The expected phrase to match
 * @param options Matching options (max typos, normalization)
 * @returns Match result with details
 *
 * @example
 * // Exact match
 * matchChallenge("i allow eslint overwriting", "i allow eslint overwriting")
 * // { matches: true, typos: 0, ... }
 *
 * // With typos (within tolerance)
 * matchChallenge("i alow eslit overwrting", "i allow eslint overwriting", { maxTypos: 3 })
 * // { matches: true, typos: 3, ... }
 *
 * // Case and punctuation flexibility
 * matchChallenge("I ALLOW ESLINT OVERWRITING!", "i allow eslint overwriting")
 * // { matches: true, typos: 0, ... }
 */
export function matchChallenge(
  input: string,
  expected: string,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): MatchResult {
  const normalizeOptions = options.normalize ?? DEFAULT_MATCH_OPTIONS.normalize;
  const maxTypos = options.maxTypos ?? DEFAULT_MATCH_OPTIONS.maxTypos ?? 0;

  const normalizedInput = normalize(input, normalizeOptions);
  const normalizedExpected = normalize(expected, normalizeOptions);

  const typos = levenshteinDistance(normalizedInput, normalizedExpected);
  const matches = typos <= maxTypos;

  return {
    matches,
    typos,
    normalizedInput,
    normalizedExpected,
  };
}

/**
 * Simple check if input matches expected phrase
 *
 * @param input User's typed input
 * @param expected The expected phrase to match
 * @param options Matching options
 * @returns true if input matches within tolerance
 */
export function matches(
  input: string,
  expected: string,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): boolean {
  return matchChallenge(input, expected, options).matches;
}

/**
 * Create a matcher function for a specific phrase
 *
 * @param expected The expected phrase
 * @param options Matching options
 * @returns A function that checks if input matches
 *
 * @example
 * const checkConfirmation = createMatcher("i allow eslint overwriting", { maxTypos: 3 });
 * checkConfirmation("i alow eslint overwrting") // true
 */
export function createMatcher(
  expected: string,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): (input: string) => boolean {
  return (input: string) => matches(input, expected, options);
}
