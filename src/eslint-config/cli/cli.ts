/**
 * ESLint CLI Framework
 *
 * A mini-framework for building interactive CLI apps with consistent navigation:
 *
 * Navigation Rules:
 * - Ctrl+C: Exit immediately from anywhere
 * - ESC: Go back one level (or exit if at root)
 * - Every menu has explicit Back/Exit options
 *
 * Usage:
 * ```ts
 * import { runApp, createScreen, select, BACK, EXIT } from "./cli/cli.js";
 *
 * const mainMenu = createScreen("main", "Main Menu", async (ctx, app) => {
 *   const choice = await select({
 *     message: "What to do?",
 *     choices: [
 *       { name: "Option 1", value: "opt1" },
 *       { name: "Option 2", value: "opt2" },
 *     ],
 *     includeExit: true, // Root menu shows Exit
 *   });
 *
 *   if (choice === "opt1") {
 *     app.push(subScreen, someContext);
 *   }
 * });
 *
 * runApp(mainMenu, initialContext);
 * ```
 */

// Types
export {
  BACK,
  EXIT,
  isBack,
  isExit,
  isNavigation,
  backChoice,
  exitChoice,
  type NavigationAction,
  type ScreenResult,
  type Screen,
  type AppController,
  type Choice,
} from "./types.js";

// App runner
export { runApp, createScreen } from "./app.js";

// Wrapped prompts
export { select, confirm, checkbox, input, pressAnyKey } from "./prompts.js";

// UI utilities
export {
  clearScreen,
  printHeader,
  printSection,
  printHint,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printCancelled,
  printGoodbye,
  progressBar,
  formatRuleValue,
  color,
} from "./ui.js";
