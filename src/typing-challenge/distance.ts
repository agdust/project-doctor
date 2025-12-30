/**
 * Typing Challenge - String Distance
 *
 * Implements Levenshtein distance for typo tolerance.
 * Levenshtein distance counts the minimum number of single-character edits
 * (insertions, deletions, substitutions) needed to transform one string into another.
 */

/**
 * Calculate the Levenshtein distance between two strings
 *
 * Uses Wagner-Fischer algorithm with O(min(m,n)) space optimization.
 *
 * @param a First string
 * @param b Second string
 * @returns Number of single-character edits needed to transform a into b
 *
 * @example
 * levenshteinDistance("kitten", "sitting") // 3
 * levenshteinDistance("hello", "helo")     // 1
 * levenshteinDistance("abc", "abc")        // 0
 */
export function levenshteinDistance(a: string, b: string): number {
  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const m = a.length;
  const n = b.length;

  // Early exit for empty strings
  if (m === 0) return n;
  if (n === 0) return m;

  // Use two rows instead of full matrix (space optimization)
  let previousRow = new Array<number>(m + 1);
  let currentRow = new Array<number>(m + 1);

  // Initialize first row
  for (let i = 0; i <= m; i++) {
    previousRow[i] = i;
  }

  // Fill in the rest of the matrix
  for (let j = 1; j <= n; j++) {
    currentRow[0] = j;

    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      currentRow[i] = Math.min(
        previousRow[i] + 1, // deletion
        currentRow[i - 1] + 1, // insertion
        previousRow[i - 1] + cost // substitution
      );
    }

    // Swap rows
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[m];
}

/**
 * Check if the distance between two strings is within a threshold
 *
 * @param a First string
 * @param b Second string
 * @param maxDistance Maximum allowed distance
 * @returns true if distance <= maxDistance
 */
export function isWithinDistance(a: string, b: string, maxDistance: number): boolean {
  return levenshteinDistance(a, b) <= maxDistance;
}
