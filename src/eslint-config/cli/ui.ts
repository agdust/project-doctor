/**
 * ESLint CLI Framework - UI Utilities
 */

import { bold, dim, cyan, green, yellow, red } from "../../utils/colors.js";

// Clear terminal screen
export function clearScreen(): void {
  process.stdout.write("\u001B[2J\u001B[H");
}

// App header
export function printHeader(): void {
  console.log();
  console.log(bold(cyan("╔═══════════════════════════════════════════════════════════╗")));
  console.log(
    `${bold(cyan("║"))}  ${bold("ESLint Configuration Builder")}                              ${bold(cyan("║"))}`,
  );
  console.log(
    `${bold(cyan("║"))}  ${dim("Build and manage your ESLint config interactively")}         ${bold(cyan("║"))}`,
  );
  console.log(bold(cyan("╚═══════════════════════════════════════════════════════════╝")));
  console.log();
}

// Section header within a screen
export function printSection(title: string): void {
  console.log();
  console.log(bold(`── ${title} ${"─".repeat(Math.max(0, 55 - title.length))}`));
  console.log();
}

// Success message
export function printSuccess(text: string): void {
  console.log(`  ${green("✓")} ${text}`);
}

// Cancelled message
export function printCancelled(): void {
  console.log(`  ${dim("Cancelled")}`);
}

// Goodbye message
export function printGoodbye(): void {
  console.log();
  console.log(`  ${dim("Goodbye!")}`);
  console.log();
}

// Progress bar
export function progressBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `${dim("[")}${"█".repeat(filled)}${dim("░".repeat(empty))}${dim("]")}`;
}

// Format rule value with color
export function formatRuleValue(value: unknown): string {
  if (typeof value === "string") {
    switch (value) {
      case "error": {
        return red(value);
      }
      case "warn": {
        return yellow(value);
      }
      case "off": {
        return dim(value);
      }
      default: {
        return value;
      }
    }
  }
  return JSON.stringify(value);
}

// Color helpers
export const color = {
  bold: bold,
  dim: dim,
  cyan: cyan,
  green: green,
  yellow: yellow,
  red: red,
};
