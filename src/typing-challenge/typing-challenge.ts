/**
 * Typing Challenge
 *
 * A module for creating typing challenges that require users to type
 * a specific phrase to confirm an action.
 *
 * Features:
 * - Case insensitivity
 * - Whitespace trimming
 * - Exact character matching (no typo tolerance)
 *
 * @example
 * ```ts
 * import { matches, createMatcher } from "./typing-challenge/typing-challenge.js";
 *
 * // Direct matching
 * if (matches(userInput, "i allow eslint overwriting")) {
 *   // proceed
 * }
 *
 * // Create reusable matcher
 * const confirmDelete = createMatcher("delete all data");
 * if (confirmDelete(userInput)) {
 *   // proceed with deletion
 * }
 * ```
 */

// Types
export { type MatchResult } from "./types.js";

// Normalization
export { normalize } from "./normalize.js";

// Matching
export { matchChallenge, matches, createMatcher } from "./matcher.js";
