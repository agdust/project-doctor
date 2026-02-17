/**
 * Typing Challenge - Input Normalization
 *
 * Normalizes input for case-insensitive comparison:
 * - Trim leading/trailing whitespace
 * - Convert to lowercase
 */

/**
 * Normalize a string for comparison (trim + lowercase)
 */
export function normalize(input: string): string {
  return input.trim().toLowerCase();
}
