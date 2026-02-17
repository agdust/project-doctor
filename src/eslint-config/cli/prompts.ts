/**
 * ESLint CLI Framework - Wrapped Prompts
 *
 * All prompts automatically handle:
 * - ESC: Returns BACK to go to previous screen
 * - Ctrl+C: Triggers app exit (handled at app level)
 */

import {
  select as inquirerSelect,
  checkbox as inquirerCheckbox,
  input as inquirerInput,
} from "@inquirer/prompts";
import { BACK, EXIT, type NavigationAction, type Choice } from "./types.js";

// Check if error is a user cancellation (ESC or Ctrl+C)
function isCancellation(error: unknown): boolean {
  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const msg = error.message.toLowerCase();
    return (
      name.includes("cancel") ||
      name.includes("exit") ||
      name.includes("abort") ||
      msg.includes("cancel") ||
      msg.includes("abort") ||
      msg.includes("user exit") ||
      msg.includes("prompt was cancelled")
    );
  }
  return false;
}

// Check if it's specifically a force exit (Ctrl+C)
function isForceExit(error: unknown): boolean {
  if (error instanceof Error) {
    // ExitPromptError is thrown on Ctrl+C
    return error.name === "ExitPromptError";
  }
  return false;
}

export interface SelectConfig<T> {
  message: string;
  choices: Choice<T>[];
  // If true, adds a back option at the end
  includeBack?: boolean;
  // If true, adds an exit option at the end (for root menus)
  includeExit?: boolean;
  // Custom back label
  backLabel?: string;
}

/**
 * Select prompt with automatic ESC handling
 * - ESC returns BACK
 * - Ctrl+C throws to trigger app exit
 */
export async function select<T>(config: SelectConfig<T>): Promise<T | NavigationAction> {
  const choices: { name: string; value: T | NavigationAction; description?: string }[] = [
    ...config.choices,
  ];

  if (config.includeBack) {
    choices.push({
      name: `\x1b[90m${config.backLabel ?? "← Back"}\x1b[0m`,
      value: BACK,
      description: "Return to previous menu",
    });
  }

  if (config.includeExit) {
    choices.push({
      name: "🚪 Exit",
      value: EXIT,
      description: "Exit the application",
    });
  }

  try {
    const result = await inquirerSelect<T | NavigationAction>({
      message: config.message,
      choices,
    });
    return result;
  } catch (error) {
    if (isForceExit(error)) {
      // Re-throw to trigger app-level exit
      throw error;
    }
    if (isCancellation(error)) {
      // ESC pressed - go back
      return BACK;
    }
    throw error;
  }
}

export interface CheckboxConfig<T> {
  message: string;
  choices: { name: string; value: T; checked?: boolean }[];
  includeBack?: boolean;
}

/**
 * Checkbox prompt with automatic ESC handling
 */
export async function checkbox<T>(config: CheckboxConfig<T>): Promise<T[] | typeof BACK> {
  try {
    return await inquirerCheckbox<T>({
      message: config.message,
      choices: config.choices,
    });
  } catch (error) {
    if (isForceExit(error)) {
      throw error;
    }
    if (isCancellation(error)) {
      return BACK;
    }
    throw error;
  }
}

export interface InputConfig {
  message: string;
  default?: string;
}

/**
 * Input prompt with automatic ESC handling
 */
export async function input(config: InputConfig): Promise<string | typeof BACK> {
  try {
    return await inquirerInput({
      message: config.message,
      default: config.default,
    });
  } catch (error) {
    if (isForceExit(error)) {
      throw error;
    }
    if (isCancellation(error)) {
      return BACK;
    }
    throw error;
  }
}

/**
 * Wait for any key press
 */
export async function pressAnyKey(message = "Press any key to continue..."): Promise<void> {
  console.log();
  console.log(`  \x1b[90m${message}\x1b[0m`);

  return new Promise((resolve) => {
    const onData = (data: Buffer): void => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode?.(false);
      process.stdin.pause();

      // Check for Ctrl+C (ASCII 3)
      if (data[0] === 3) {
        // Trigger exit
        process.emit("SIGINT");
        return;
      }

      resolve();
    };

    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.once("data", onData);
  });
}
