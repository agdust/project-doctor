/**
 * ANSI Color Codes
 *
 * Centralized color constants for consistent CLI output.
 * Use these instead of inline ANSI codes throughout the codebase.
 */

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[90m";
export const RED = "\x1b[31m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const BLUE = "\x1b[34m";
export const CYAN = "\x1b[36m";

/**
 * Color helper functions for common patterns
 */
export const fmt = {
  error: (msg: string) => `${RED}${msg}${RESET}`,
  success: (msg: string) => `${GREEN}${msg}${RESET}`,
  warn: (msg: string) => `${YELLOW}${msg}${RESET}`,
  info: (msg: string) => `${CYAN}${msg}${RESET}`,
  bold: (msg: string) => `${BOLD}${msg}${RESET}`,
  dim: (msg: string) => `${DIM}${msg}${RESET}`,
};
