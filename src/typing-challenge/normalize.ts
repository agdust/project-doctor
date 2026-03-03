/**
 * Typing Challenge - Input Normalization
 *
 * Normalizes input for case-insensitive comparison:
 * - Trim leading/trailing whitespace
 * - Convert to lowercase
 */
export function normalize(input: string): string {
  return input.trim().toLowerCase();
}
