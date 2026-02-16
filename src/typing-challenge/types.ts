/**
 * Typing Challenge - Types
 */

export interface NormalizeOptions {
  // Convert to lowercase
  lowercase?: boolean;
  // Remove punctuation and special characters
  removePunctuation?: boolean;
  // Collapse multiple spaces to single space
  collapseSpaces?: boolean;
  // Trim leading/trailing whitespace
  trim?: boolean;
}

export interface MatchOptions {
  // Maximum allowed typos (Levenshtein distance)
  maxTypos?: number;
  // Normalization options applied before matching
  normalize?: NormalizeOptions;
}

export interface MatchResult {
  // Whether the input matches the expected phrase
  matches: boolean;
  // Number of typos detected (0 if exact match)
  typos: number;
  // Normalized input that was compared
  normalizedInput: string;
  // Normalized expected phrase
  normalizedExpected: string;
}

export const DEFAULT_NORMALIZE_OPTIONS: NormalizeOptions = {
  lowercase: true,
  removePunctuation: true,
  collapseSpaces: true,
  trim: true,
};

export const DEFAULT_MATCH_OPTIONS: MatchOptions = {
  maxTypos: 3,
  normalize: DEFAULT_NORMALIZE_OPTIONS,
};
