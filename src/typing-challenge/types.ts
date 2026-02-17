/**
 * Typing Challenge - Types
 *
 * Simple exact-match typing challenge (case-insensitive, trimmed).
 */

export interface MatchResult {
  /** Whether the input matches the expected phrase */
  matches: boolean;
  /** Normalized input that was compared */
  normalizedInput: string;
  /** Normalized expected phrase */
  normalizedExpected: string;
}
