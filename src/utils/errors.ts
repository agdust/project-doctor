/**
 * Error handling utilities
 */

/** Extract a message from an unknown error value */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
