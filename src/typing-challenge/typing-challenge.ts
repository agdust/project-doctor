/**
 * Typing Challenge
 *
 * A module for creating typing challenges that require users to type
 * a specific phrase to confirm an action. Supports:
 *
 * - Case insensitivity
 * - Punctuation tolerance
 * - Space normalization
 * - Typo tolerance (configurable)
 *
 * @example
 * ```ts
 * import { matchChallenge, createMatcher } from "./typing-challenge/typing-challenge.js";
 *
 * // Direct matching
 * const result = matchChallenge("i alow eslint overwrting", "i allow eslint overwriting");
 * if (result.matches) {
 *   console.log(`Matched with ${result.typos} typos`);
 * }
 *
 * // Create reusable matcher
 * const confirmDelete = createMatcher("delete all data", { maxTypos: 2 });
 * if (confirmDelete(userInput)) {
 *   // proceed with deletion
 * }
 * ```
 */

// Types
export {
  type NormalizeOptions,
  type MatchOptions,
  type MatchResult,
  DEFAULT_NORMALIZE_OPTIONS,
  DEFAULT_MATCH_OPTIONS,
} from "./types.js";

// Normalization
export { normalize } from "./normalize.js";

// Distance calculation
export { levenshteinDistance, isWithinDistance } from "./distance.js";

// Matching
export { matchChallenge, matches, createMatcher } from "./matcher.js";
