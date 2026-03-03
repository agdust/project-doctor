/**
 * Renderer - Console output utilities
 *
 * Minimal helpers for consistent CLI output.
 * Uses centralized color utilities.
 */

import { bold, dim, red, green, yellow, cyan } from "../utils/colors.js";

/**
 * Centralized icon registry — use these instead of inline symbols.
 */
export const ICONS = {
  pass: "✓",
  fail: "✗",
  warn: "⚠",
  info: "→",
  skip: "○",
  muted: "⏲",
  disabled: "–",
  paused: "⏸",
  noEntry: "⊘",
  unchecked: "□",
} as const;

/**
 * Print a horizontal divider
 */
export function divider(width = 45): void {
  console.log(dim(`  ${"─".repeat(width)}`));
}

/**
 * Print a blank line
 */
export function blank(): void {
  // AGENT: make sure all empty strings renderings use this function
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
  console.log(`${prefix}${bold(content)}`);
}

/**
 * Print dim/muted text
 */
export function muted(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${dim(content)}`);
}

/**
 * Print success message
 */
export function success(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${green(`✓ ${content}`)}`);
}

/**
 * Print error message
 */
export function error(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${red(`✗ ${content}`)}`);
}

/**
 * Print warning message
 */
export function warn(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${yellow(`⚠ ${content}`)}`);
}

/**
 * Print info message
 */
export function info(content: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${cyan(`→ ${content}`)}`);
}

/**
 * Print a key-value pair
 */
export function keyValue(key: string, value: string, indent = 2): void {
  const prefix = " ".repeat(indent);
  console.log(`${prefix}${dim(`${key}:`)} ${value}`);
}

/**
 * Print a header with app name
 */
export function header(appName: string, subtitle?: string): void {
  blank();
  title(appName);
  if (subtitle !== undefined) {
    muted(subtitle);
  }
  blank();
}

// Strip ANSI codes for visible length calculation
function stripAnsi(str: string): string {
  return str.replaceAll(/\u001B\[[0-9;]*m/g, "");
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
  console.log(`  ${dim(`╭${line}╮`)}`);
  console.log(`  ${dim("│")}  ${bold(appName)}  ${dim("│")}`);
  console.log(`  ${dim(`╰${line}╯`)}`);
}

/**
 * Print a status line with icon
 */
export function status(
  icon: "pass" | "fail" | "warn" | "info" | "skip",
  label: string,
  message?: string,
  indent = 2,
): void {
  const prefix = " ".repeat(indent);
  const icons = {
    pass: green(ICONS.pass),
    fail: red(ICONS.fail),
    warn: yellow(ICONS.warn),
    info: cyan(ICONS.info),
    skip: dim(ICONS.skip),
  };

  const iconStr = icons[icon];
  const messageStr = message === undefined ? "" : dim(` - ${message}`);
  console.log(`${prefix}${iconStr} ${label}${messageStr}`);
}

/**
 * Clear screen
 */
export function clear(): void {
  console.clear();
}

/**
 * Export color functions for custom use
 */
export const colors = {
  bold,
  dim,
  red,
  green,
  yellow,
  cyan,
};
