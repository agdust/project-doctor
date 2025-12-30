/**
 * ESLint CLI Framework - Core Types
 *
 * This mini-framework provides consistent navigation behavior:
 * - Ctrl+C: Always exits the CLI completely
 * - ESC: Always goes back one level (or exits if at root)
 * - Every screen has explicit back/exit options
 */

// Result of a screen action
export const BACK = Symbol("back");
export const EXIT = Symbol("exit");
export type NavigationAction = typeof BACK | typeof EXIT;

// Screen result - either navigate or continue
export type ScreenResult<T = void> = T | NavigationAction;

// Check if result is a navigation action
export function isBack(result: unknown): result is typeof BACK {
  return result === BACK;
}

export function isExit(result: unknown): result is typeof EXIT {
  return result === EXIT;
}

export function isNavigation(result: unknown): result is NavigationAction {
  return isBack(result) || isExit(result);
}

// Screen definition - a unit of UI
export type Screen<TContext = void> = {
  id: string;
  title: string;
  run: (ctx: TContext, app: AppController) => Promise<ScreenResult>;
};

// App controller passed to screens
export type AppController = {
  // Navigate to a screen (pushes onto stack)
  push: <T>(screen: Screen<T>, context: T) => void;
  // Go back one level
  back: () => void;
  // Exit the app completely
  exit: () => void;
  // Clear screen and show header
  refresh: () => void;
  // Get current navigation depth
  depth: () => number;
};

// Choice with optional back marker
export type Choice<T> = {
  name: string;
  value: T;
  description?: string;
};

// Standard back choice
export function backChoice<T>(label = "← Back"): Choice<T | typeof BACK> {
  return {
    name: `\x1b[90m${label}\x1b[0m`,
    value: BACK as T | typeof BACK,
    description: "Return to previous menu",
  };
}

// Standard exit choice
export function exitChoice<T>(label = "🚪 Exit"): Choice<T | typeof EXIT> {
  return {
    name: label,
    value: EXIT as T | typeof EXIT,
    description: "Exit the application",
  };
}
