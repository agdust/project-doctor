/**
 * Date formatting and validation utilities
 */

/** Regex for ISO date format YYYY-MM-DD */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Format a Date to YYYY-MM-DD string using UTC.
 *
 * Uses UTC to ensure consistent behavior across timezones.
 */
export function toDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Add a number of weeks to a date. */
export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

/** Add a number of months to a date. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Parse and validate an ISO date string (YYYY-MM-DD).
 *
 * Returns a Date set to end of day UTC, or null if invalid.
 */
export function parseISODate(dateStr: string): Date | null {
  if (!ISO_DATE_REGEX.test(dateStr)) {
    return null;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  // Use UTC to ensure consistent behavior across timezones
  // End of day in UTC (23:59:59.999)
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // Check if the date is valid (e.g., reject "2025-02-30")
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}
