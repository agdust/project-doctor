/**
 * Git Safety Check
 *
 * Ensures user acknowledges risks when running without git protection.
 * Shows a warning on first run if no git repo is detected.
 */

import { existsSync } from "node:fs";
import path from "node:path";
import * as readline from "node:readline";
import { loadConfig, updateConfig } from "../config/loader.js";
import { createMatcher } from "../typing-challenge/typing-challenge.js";
import { bold, dim, yellow, red, green, cyan } from "./colors.js";
import { blank } from "../cli-framework/renderer.js";

const CHALLENGE_PHRASE = "i understand the risks";

// Create matcher for exact phrase (case-insensitive, trimmed)
const matchesChallenge = createMatcher(CHALLENGE_PHRASE);

/**
 * Check if project has a git repository
 */
export function hasGitRepo(projectPath: string): boolean {
  // AGENT: does this check that cwd can be inside if git repo, and not be root of it?
  const gitDir = path.join(projectPath, ".git");
  return existsSync(gitDir);
}

/**
 * Prompt user for input (simple readline-based, no inquirer)
 * Returns null if ESC is pressed.
 */
async function promptInput(message: string): Promise<string | null> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    let resolved = false;

    const onKeypress = (_ch: string, key: { name?: string }) => {
      if (key?.name === "escape" && !resolved) {
        resolved = true;
        process.stdin.removeListener("keypress", onKeypress);
        rl.close();
        resolve(null);
      }
    };

    process.stdin.on("keypress", onKeypress);

    rl.question(`  ${message}: `, (answer) => {
      if (!resolved) {
        resolved = true;
        process.stdin.removeListener("keypress", onKeypress);
        rl.close();
        resolve(answer);
      }
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
  blank();
  blank();
  console.log(`  ${yellow(`┌${"─".repeat(58)}┐`)}`);
  console.log(
    `  ${yellow("│")}  ${bold(yellow("WARNING: No Git Repository Detected"))}${" ".repeat(21)}${yellow("│")}`,
  );
  console.log(`  ${yellow(`└${"─".repeat(58)}┘`)}`);
  blank();
  console.log(`  ${dim("This project is not under version control.")}`);
  console.log(`  ${dim("Project Doctor can modify files as part of auto-fixes.")}`);
  console.log(`  ${dim("Without git, you cannot easily undo these changes.")}`);
  blank();
  console.log(`  ${bold("Recommended:")} Run ${cyan("git init")} before proceeding.`);
  blank();
  console.log(`  ${dim("To continue anyway, type:")} ${cyan(CHALLENGE_PHRASE)}`);
  blank();

  const answer = await promptInput("Type to confirm (or press ESC/Enter to cancel)");

  if (answer === null || !answer.trim()) {
    blank();
    console.log(`  ${red("Cancelled.")} Initialize git with: ${cyan("git init")}`);
    blank();
    return false;
  }

  if (!matchesChallenge(answer)) {
    blank();
    console.log(`  ${red("Confirmation did not match.")} Operation cancelled.`);
    blank();
    return false;
  }

  // Save confirmation to config
  await updateConfig(projectPath, { noGitConfirmed: true });

  blank();
  console.log(
    `  ${green("Confirmed.")} ${dim("This warning won't appear again for this project.")}`,
  );
  blank();

  return true;
}
