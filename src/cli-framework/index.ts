/**
 * CLI Framework - Minimal, declarative, config-driven
 *
 * Build multi-screen CLI apps with navigation, back buttons,
 * ESC handling, and graceful exit - all from a single config.
 *
 * @example
 * ```typescript
 * import { runApp, nav, action, Screen } from "./cli-framework";
 *
 * type MyContext = { count: number };
 *
 * const homeScreen: Screen<MyContext> = {
 *   id: "home",
 *   render: (ctx) => console.log(`Count: ${ctx.count}`),
 *   options: [
 *     nav("settings", "Settings", "settings"),
 *     action("increment", "Add one", async (ctx) => {
 *       ctx.count++;
 *     }),
 *   ],
 *   noBack: true, // Root screen
 * };
 *
 * await runApp({
 *   name: "my-app",
 *   context: { count: 0 },
 *   screens: [homeScreen],
 * });
 * ```
 */

// Core types
export type {
  ActionOption,
  NavOption,
  Separator,
  Option,
  Screen,
  AppConfig,
  AppState,
} from "./types.js";

// Helper functions for creating options
export { action, nav, separator, back } from "./types.js";

// App runtime
export { App, runApp } from "./app.js";

// Renderer utilities
export {
  divider,
  blank,
  text,
  title,
  muted,
  success,
  error,
  warn,
  info,
  keyValue,
  header,
  status,
  clear,
  colors,
} from "./renderer.js";
