/**
 * Typing Challenge - Matcher
 *
 * Exact string matching (case-insensitive, trimmed).
 */

import { normalize } from "./normalize.js";
import type { MatchResult } from "./types.js";

/**
 * Check if user input exactly matches the expected phrase
 * (case-insensitive, trimmed)
 *
 * @param input User's typed input
 * @param expected The expected phrase to match
 * @returns Match result with details
 *
 * @example
 * matchChallenge("I Allow ESLint Overwriting", "i allow eslint overwriting")
 * // { matches: true, normalizedInput: "i allow eslint overwriting", ... }
 */
export function matchChallenge(input: string, expected: string): MatchResult {
  const normalizedInput = normalize(input);
  const normalizedExpected = normalize(expected);

  return {
    matches: normalizedInput === normalizedExpected,
    normalizedInput,
    normalizedExpected,
  };
}

/**
 * Simple check if input matches expected phrase
 *
 * @param input User's typed input
 * @param expected The expected phrase to match
 * @returns true if input matches exactly (case-insensitive, trimmed)
 */
export function matches(input: string, expected: string): boolean {
  return matchChallenge(input, expected).matches;
}

/**
 * Create a matcher function for a specific phrase
 *
 * @param expected The expected phrase
 * @returns A function that checks if input matches
 *
 * @example
 * const checkConfirmation = createMatcher("i allow eslint overwriting");
 * checkConfirmation("I Allow ESLint Overwriting") // true
 */
export function createMatcher(expected: string): (input: string) => boolean {
  return (input: string) => matches(input, expected);
}
