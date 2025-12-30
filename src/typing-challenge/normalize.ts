/**
 * Typing Challenge - Input Normalization
 *
 * Normalizes user input to allow flexible matching:
 * - Case insensitive
 * - Punctuation ignored
 * - Extra spaces collapsed
 */

import { DEFAULT_NORMALIZE_OPTIONS, type NormalizeOptions } from "./types.js";

/**
 * Normalize a string according to the given options
 */
export function normalize(input: string, options: NormalizeOptions = DEFAULT_NORMALIZE_OPTIONS): string {
  let result = input;

  if (options.lowercase) {
    result = result.toLowerCase();
  }

  if (options.removePunctuation) {
    // Keep only letters, numbers, and spaces
    result = result.replace(/[^a-zA-Z0-9\s]/g, "");
  }

  if (options.collapseSpaces) {
    result = result.replace(/\s+/g, " ");
  }

  if (options.trim) {
    result = result.trim();
  }

  return result;
}
