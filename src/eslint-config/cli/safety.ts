/**
 * ESLint CLI - Safety checks before modifying config
 *
 * Checks git status and requires user confirmation if:
 * - No git repo initialized (risk of data loss)
 * - Uncommitted changes to eslint config files
 *
 * Confirmation is cached in the project config so users don't
 * have to type the challenge phrase every time.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { input } from "./prompts.js";
import { color } from "./ui.js";
import { isBack } from "./types.js";
import { createMatcher } from "../../typing-challenge/typing-challenge.js";
import { loadConfig, updateConfig } from "../../config/loader.js";

const CHALLENGE_PHRASE = "i allow eslint overwriting";

// Create matcher with up to 3 typos allowed
const matchesChallenge = createMatcher(CHALLENGE_PHRASE, { maxTypos: 3 });

// Eslint config file patterns to check for uncommitted changes
const ESLINT_CONFIG_PATTERNS = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.yaml",
  ".eslintrc.yml",
];

export type SafetyStatus = {
  hasGitRepo: boolean;
  hasPendingChanges: boolean;
  pendingFiles: string[];
};

/**
 * Check git status for the project
 */
export function checkGitStatus(projectPath: string): SafetyStatus {
  const gitDir = join(projectPath, ".git");
  const hasGitRepo = existsSync(gitDir);

  if (!hasGitRepo) {
    return { hasGitRepo: false, hasPendingChanges: false, pendingFiles: [] };
  }

  // Check for uncommitted changes in eslint config files
  try {
    // Get both staged and unstaged changes
    // Use execFileSync to avoid shell injection
    const statusOutput = execFileSync("git", ["status", "--porcelain"], {
      cwd: projectPath,
      encoding: "utf-8",
    });

    const pendingFiles: string[] = [];

    for (const line of statusOutput.split("\n")) {
      if (!line.trim()) continue;

      // Status is first 2 chars, filename starts at position 3
      const filename = line.slice(3).trim();

      // Check if this is an eslint config file
      for (const pattern of ESLINT_CONFIG_PATTERNS) {
        if (filename === pattern || filename.endsWith("/" + pattern)) {
          pendingFiles.push(filename);
          break;
        }
      }
    }

    return {
      hasGitRepo: true,
      hasPendingChanges: pendingFiles.length > 0,
      pendingFiles,
    };
  } catch {
    // Git command failed - treat as no pending changes
    return { hasGitRepo: true, hasPendingChanges: false, pendingFiles: [] };
  }
}

// Track if user has already confirmed in this session (in-memory cache)
let sessionConfirmed = false;

/**
 * Reset session confirmation (for testing)
 */
export function resetSessionConfirmation(): void {
  sessionConfirmed = false;
}

/**
 * Check if user has previously confirmed via config
 */
async function isConfirmedInConfig(projectPath: string): Promise<boolean> {
  const config = await loadConfig(projectPath);
  return config?.eslintOverwriteConfirmed === true;
}

/**
 * Save confirmation to config
 */
async function saveConfirmationToConfig(projectPath: string): Promise<void> {
  await updateConfig(projectPath, { eslintOverwriteConfirmed: true });
}

/**
 * Run safety check and prompt for confirmation if needed
 * Returns true if safe to proceed, false if user cancelled
 */
export async function ensureSafeToModify(projectPath: string): Promise<boolean> {
  // Skip if already confirmed this session
  if (sessionConfirmed) {
    return true;
  }

  // Skip if already confirmed in config
  if (await isConfirmedInConfig(projectPath)) {
    sessionConfirmed = true;
    return true;
  }

  const status = checkGitStatus(projectPath);

  // Case 1: No git repo - warn about data loss
  if (!status.hasGitRepo) {
    console.log();
    console.log(`  ${color.yellow("⚠")} ${color.bold("Warning: No git repository detected")}`);
    console.log();
    console.log(`  ${color.dim("This project is not under version control.")}`);
    console.log(`  ${color.dim("Changes to your ESLint config cannot be easily reverted.")}`);
    console.log();

    const confirmed = await promptChallenge("To proceed without git protection");
    if (!confirmed) return false;

    await saveConfirmationToConfig(projectPath);
    sessionConfirmed = true;
    return true;
  }

  // Case 2: Git repo with pending eslint config changes
  if (status.hasPendingChanges) {
    console.log();
    console.log(`  ${color.yellow("⚠")} ${color.bold("Warning: Uncommitted ESLint config changes")}`);
    console.log();
    console.log(`  ${color.dim("The following files have uncommitted changes:")}`);
    for (const file of status.pendingFiles) {
      console.log(`    ${color.yellow("•")} ${file}`);
    }
    console.log();
    console.log(`  ${color.dim("Consider committing or stashing these changes first.")}`);
    console.log();

    const confirmed = await promptChallenge("To proceed and overwrite these changes");
    if (!confirmed) return false;

    await saveConfirmationToConfig(projectPath);
    sessionConfirmed = true;
    return true;
  }

  // Case 3: Git repo, no pending changes - safe to proceed
  return true;
}

/**
 * Prompt user to type the challenge phrase
 */
async function promptChallenge(context: string): Promise<boolean> {
  console.log(`  ${context}, type: ${color.cyan(CHALLENGE_PHRASE)}`);
  console.log();

  const result = await input({
    message: "Type to confirm",
  });

  if (isBack(result)) {
    return false;
  }

  if (!matchesChallenge(result)) {
    console.log();
    console.log(`  ${color.red("✗")} Confirmation did not match. Operation cancelled.`);
    console.log();
    return false;
  }

  console.log();
  console.log(`  ${color.green("✓")} Confirmed`);
  console.log();

  return true;
}
