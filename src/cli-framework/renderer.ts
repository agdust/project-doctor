/**
 * Renderer - Console output utilities
 *
 * Minimal helpers for consistent CLI output.
 * Uses ANSI codes directly (no dependencies).
 */

// ANSI color codes
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
} as const;

/**
 * Print a horizontal divider
 */
export function divider(width = 45): void {
  console.log(`${c.dim}  ${"─".repeat(width)}${c.reset}`);
}

/**
 * Print a blank line
 */
export function blank(): void {
  console.log();
}

/**
 * Print text with indent
 */
export function text(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${content}`);
}

/**
 * Print bold text
 */
export function title(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${c.bold}${content}${c.reset}`);
}

/**
 * Print dim/muted text
 */
export function muted(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${c.dim}${content}${c.reset}`);
}

/**
 * Print success message
 */
export function success(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${c.green}✓ ${content}${c.reset}`);
}

/**
 * Print error message
 */
export function error(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${c.red}✗ ${content}${c.reset}`);
}

/**
 * Print warning message
 */
export function warn(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${c.yellow}⚠ ${content}${c.reset}`);
}

/**
 * Print info message
 */
export function info(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${c.cyan}→ ${content}${c.reset}`);
}

/**
 * Print a key-value pair
 */
export function keyValue(key: string, value: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${c.dim}${key}:${c.reset} ${value}`);
}

/**
 * Print a header with app name
 */
export function header(appName: string, subtitle?: string): void {
  blank();
  title(appName);
  if (subtitle) {
    muted(subtitle);
  }
  blank();
}

// Strip ANSI codes for visible length calculation
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Print large app name using unicode block characters.
 * Supports ANSI codes in the string (they're stripped for width calculation).
 */
export function bigTitle(appName: string): void {
  // Use bold + larger visual presence with box drawing
  const visibleLength = stripAnsi(appName).length;
  const line = "─".repeat(visibleLength + 4);
  console.log();
  console.log(`  ${c.dim}╭${line}╮${c.reset}`);
  console.log(`  ${c.dim}│${c.reset}  ${c.bold}${appName}${c.reset}  ${c.dim}│${c.reset}`);
  console.log(`  ${c.dim}╰${line}╯${c.reset}`);
}

/**
 * Print a status line with icon
 */
export function status(
  icon: "pass" | "fail" | "warn" | "info" | "skip",
  label: string,
  message?: string,
  indent = 2
): void {
  const prefix = " ".repeat(indent);
  const icons = {
    pass: `${c.green}✓${c.reset}`,
    fail: `${c.red}✗${c.reset}`,
    warn: `${c.yellow}⚠${c.reset}`,
    info: `${c.cyan}→${c.reset}`,
    skip: `${c.dim}○${c.reset}`,
  };

  const iconStr = icons[icon];
  const messageStr = message ? `${c.dim} - ${message}${c.reset}` : "";
  console.log(`${prefix}${iconStr} ${label}${messageStr}`);
}

/**
 * Clear screen
 */
export function clear(): void {
  console.clear();
}

/**
 * Export colors for custom use
 */
export const colors = c;
