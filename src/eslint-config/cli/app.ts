/**
 * ESLint CLI Framework - App Runner
 *
 * Manages screen navigation with a stack-based approach:
 * - Screens can push new screens onto the stack
 * - Back/ESC pops the current screen
 * - Ctrl+C exits immediately from anywhere
 */

import { BACK, EXIT, isBack, isExit, type Screen, type AppController } from "./types.js";
import { clearScreen, printHeader, printGoodbye } from "./ui.js";
import { pressAnyKey } from "./prompts.js";

interface StackEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic screen stack requires any
  screen: Screen<any>;
  context: unknown;
}

export interface AppConfig {
  // Called on exit
  onExit?: () => void;
}

/**
 * Run the CLI app starting with the given screen
 */
export async function runApp<T>(
  initialScreen: Screen<T>,
  initialContext: T,
  config: AppConfig = {},
): Promise<void> {
  const stack: StackEntry[] = [{ screen: initialScreen, context: initialContext }];
  let pendingPush: StackEntry | null = null;
  let shouldExit = false;
  let shouldBack = false;

  // Controller passed to screens
  const controller: AppController = {
    push: <C>(screen: Screen<C>, context: C) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic screen stack requires any
      pendingPush = { screen: screen as Screen<any>, context };
    },
    back: () => {
      shouldBack = true;
    },
    exit: () => {
      shouldExit = true;
    },
    refresh: () => {
      clearScreen();
      printHeader();
    },
    depth: () => stack.length,
  };

  // Handle Ctrl+C globally
  const handleExit = (): void => {
    printGoodbye();
    config.onExit?.();
    process.exit(0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);

  try {
    clearScreen();
    printHeader();

    while (stack.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed by while (stack.length > 0)
      const current = stack.at(-1)!;
      pendingPush = null;
      shouldBack = false;
      shouldExit = false;

      try {
        const result = await current.screen.run(current.context, controller);

        // Handle navigation results
        if (isExit(result) || shouldExit) {
          break;
        }

        if (isBack(result) || shouldBack) {
          stack.pop();
          if (stack.length > 0) {
            clearScreen();
            printHeader();
          }
          continue;
        }

        // Handle screen push
        if (pendingPush) {
          stack.push(pendingPush);
          clearScreen();
          printHeader();
          continue;
        }

        // Screen completed normally - wait and refresh
        await pressAnyKey();
        clearScreen();
        printHeader();
      } catch (error) {
        // Check if this is a force exit (Ctrl+C during prompt)
        if (isForceExitError(error)) {
          break;
        }
        throw error;
      }
    }

    printGoodbye();
  } finally {
    process.removeListener("SIGINT", handleExit);
    process.removeListener("SIGTERM", handleExit);
    config.onExit?.();
  }
}

function isForceExitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === "ExitPromptError";
  }
  return false;
}

/**
 * Create a simple screen from a render function
 */
export function createScreen<T>(
  id: string,
  title: string,
  run: (ctx: T, app: AppController) => Promise<typeof BACK | typeof EXIT | undefined>,
): Screen<T> {
  return { id, title, run };
}
