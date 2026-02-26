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
