/**
 * Color utilities using picocolors
 *
 * Provides color functions for CLI output with automatic
 * terminal color support detection.
 */

import pc from "picocolors";

// Re-export picocolors functions for convenience
export const bold = pc.bold;
export const dim = pc.dim;
export const red = pc.red;
export const green = pc.green;
export const yellow = pc.yellow;
export const cyan = pc.cyan;
export const blue = pc.blue;
export const magenta = pc.magenta;
export const gray = pc.gray;
export const white = pc.white;

// Combination helpers
export const boldRed = (s: string) => pc.bold(pc.red(s));
export const boldGreen = (s: string) => pc.bold(pc.green(s));
export const boldYellow = (s: string) => pc.bold(pc.yellow(s));
export const boldCyan = (s: string) => pc.bold(pc.cyan(s));
