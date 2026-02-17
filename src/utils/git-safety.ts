/**
 * Git Safety Check
 *
 * Ensures user acknowledges risks when running without git protection.
 * Shows a warning on first run if no git repo is detected.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import * as readline from "node:readline";
import { loadConfig, updateConfig } from "../config/loader.js";
import { createMatcher } from "../typing-challenge/typing-challenge.js";
import { RESET, BOLD, DIM, YELLOW, RED, GREEN, CYAN } from "./colors.js";

const CHALLENGE_PHRASE = "i understand the risks";

// Create matcher for exact phrase (case-insensitive, trimmed)
const matchesChallenge = createMatcher(CHALLENGE_PHRASE);

/**
 * Check if project has a git repository
 */
export function hasGitRepo(projectPath: string): boolean {
  const gitDir = join(projectPath, ".git");
  return existsSync(gitDir);
}

/**
 * Prompt user for input (simple readline-based, no inquirer)
 */
async function promptInput(message: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`  ${message}: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Check git safety and prompt for confirmation if needed.
 *
 * Returns true if safe to proceed, false if user cancelled.
 *
 * @param projectPath - Path to the project directory
 */
export async function ensureGitSafety(projectPath: string): Promise<boolean> {
  // If git repo exists, we're safe
  if (hasGitRepo(projectPath)) {
    return true;
  }

  // Check if user already confirmed in config
  const config = await loadConfig(projectPath);
  if (config?.noGitConfirmed === true) {
    return true;
  }

  // Show warning
  console.log();
  console.log();
  console.log(`  ${YELLOW}┌${"─".repeat(58)}┐${RESET}`);
  console.log(`  ${YELLOW}│${RESET}  ${BOLD}${YELLOW}WARNING: No Git Repository Detected${RESET}${" ".repeat(21)}${YELLOW}│${RESET}`);
  console.log(`  ${YELLOW}└${"─".repeat(58)}┘${RESET}`);
  console.log();
  console.log(`  ${DIM}This project is not under version control.${RESET}`);
  console.log(`  ${DIM}Project Doctor can modify files as part of auto-fixes.${RESET}`);
  console.log(`  ${DIM}Without git, you cannot easily undo these changes.${RESET}`);
  console.log();
  console.log(`  ${BOLD}Recommended:${RESET} Run ${CYAN}git init${RESET} before proceeding.`);
  console.log();
  console.log(`  ${DIM}To continue anyway, type: ${RESET}${CYAN}${CHALLENGE_PHRASE}${RESET}`);
  console.log();

  const answer = await promptInput("Type to confirm (or press Enter to cancel)");

  if (!answer.trim()) {
    console.log();
    console.log(`  ${RED}Cancelled.${RESET} Initialize git with: ${CYAN}git init${RESET}`);
    console.log();
    return false;
  }

  if (!matchesChallenge(answer)) {
    console.log();
    console.log(`  ${RED}Confirmation did not match.${RESET} Operation cancelled.`);
    console.log();
    return false;
  }

  // Save confirmation to config
  await updateConfig(projectPath, { noGitConfirmed: true });

  console.log();
  console.log(`  ${GREEN}Confirmed.${RESET} ${DIM}This warning won't appear again for this project.${RESET}`);
  console.log();

  return true;
}
