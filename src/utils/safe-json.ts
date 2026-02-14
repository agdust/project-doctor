/**
 * Safe JSON parsing utilities
 *
 * Provides JSON parsing with prototype pollution protection.
 */

import JSON5 from "json5";

// Keys that could be used for prototype pollution
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Recursively remove dangerous keys from an object.
 * This prevents prototype pollution attacks.
 */
function sanitizeObject<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) {
      // Skip dangerous keys
      continue;
    }
    result[key] = sanitizeObject(value);
  }

  return result as T;
}

/**
 * Safely parse JSON with prototype pollution protection.
 * Returns null if parsing fails.
 */
export function safeJsonParse<T>(content: string): T | null {
  try {
    const parsed = JSON.parse(content);
    return sanitizeObject(parsed) as T;
  } catch {
    return null;
  }
}

/**
 * Safely parse JSON5 with prototype pollution protection.
 * Returns null if parsing fails.
 */
export function safeJson5Parse<T>(content: string): T | null {
  try {
    const parsed = JSON5.parse(content);
    return sanitizeObject(parsed) as T;
  } catch {
    return null;
  }
}

/**
 * Safely merge objects, filtering out dangerous keys.
 * Use this instead of spread operator for untrusted data.
 */
export function safeMerge<T extends object>(base: T, overrides: Partial<T>): T {
  const result = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    if (DANGEROUS_KEYS.has(key)) {
      continue;
    }
    (result as Record<string, unknown>)[key] = value;
  }

  return result;
}

/**
 * Safely merge record objects (like config.checks), filtering out dangerous keys.
 */
export function safeMergeRecords<T>(
  base: Record<string, T> | undefined,
  overrides: Record<string, T> | undefined
): Record<string, T> {
  const result: Record<string, T> = {};

  if (base) {
    for (const [key, value] of Object.entries(base)) {
      if (!DANGEROUS_KEYS.has(key)) {
        result[key] = value;
      }
    }
  }

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (!DANGEROUS_KEYS.has(key)) {
        result[key] = value;
      }
    }
  }

  return result;
}
