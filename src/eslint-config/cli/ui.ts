/**
 * ESLint CLI Framework - UI Utilities
 */

// Clear terminal screen
export function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

// App header
export function printHeader(): void {
  console.log();
  console.log(
    "\x1b[1m\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m",
  );
  console.log(
    "\x1b[1m\x1b[36m║\x1b[0m  \x1b[1mESLint Configuration Builder\x1b[0m                              \x1b[1m\x1b[36m║\x1b[0m",
  );
  console.log(
    "\x1b[1m\x1b[36m║\x1b[0m  \x1b[90mBuild and manage your ESLint config interactively\x1b[0m         \x1b[1m\x1b[36m║\x1b[0m",
  );
  console.log(
    "\x1b[1m\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m",
  );
  console.log();
}

// Section header within a screen
export function printSection(title: string): void {
  console.log();
  console.log(`\x1b[1m── ${title} ${"─".repeat(Math.max(0, 55 - title.length))}\x1b[0m`);
  console.log();
}

// Success message
export function printSuccess(text: string): void {
  console.log(`  \x1b[32m✓\x1b[0m ${text}`);
}

// Cancelled message
export function printCancelled(): void {
  console.log("  \x1b[90mCancelled\x1b[0m");
}

// Goodbye message
export function printGoodbye(): void {
  console.log();
  console.log("  \x1b[90mGoodbye!\x1b[0m");
  console.log();
}

// Progress bar
export function progressBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `\x1b[90m[\x1b[0m${"█".repeat(filled)}\x1b[90m${"░".repeat(empty)}]\x1b[0m`;
}

// Format rule value with color
export function formatRuleValue(value: unknown): string {
  if (typeof value === "string") {
    const colors: Record<string, string> = {
      error: "\x1b[31m",
      warn: "\x1b[33m",
      off: "\x1b[90m",
    };
    return `${colors[value] ?? ""}${value}\x1b[0m`;
  }
  return JSON.stringify(value);
}

// Color helpers
export const color = {
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[90m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
};
