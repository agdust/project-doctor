/**
 * CLI Framework - Minimal, declarative, config-driven
 *
 * Design principles:
 * - Declarative-first: describe what, not how
 * - Smart defaults: back buttons, ESC, Ctrl+C handled automatically
 * - Config-driven: single object describes entire app
 * - No hidden magic: behavior is predictable and explicit
 */

// ============================================================================
// Options - What users can do on a screen
// ============================================================================

/** Base option properties */
interface BaseOption {
  /** Unique identifier */
  value: string;
  /** Display text */
  label: string;
  /** Optional description shown below label */
  description?: string;
}

/** Action that does something and optionally navigates */
export type ActionOption<TCtx> = BaseOption & {
  type: "action";
  /** Run the action. Return next screen ID to navigate, or void to stay. */
  run: (ctx: TCtx) => Promise<string | void>;
};

/** Navigation to another screen */
export type NavOption = BaseOption & {
  type: "nav";
  /** Target screen ID */
  to: string;
  /** Optional badge (e.g., "3 issues") */
  badge?: string;
};

/** Separator line between option groups */
export interface Separator {
  type: "separator";
  label?: string;
}

export type Option<TCtx> = ActionOption<TCtx> | NavOption | Separator;

// ============================================================================
// Screens - UI states
// ============================================================================

export interface Screen<TCtx> {
  /** Unique screen identifier */
  id: string;

  /** Parent screen ID for back navigation (hierarchy-based, not history) */
  parent?: string;

  /** Render screen content (called before showing options) */
  render: (ctx: TCtx) => void;

  /**
   * Screen options - static array or dynamic function
   * Back option is added automatically if parent is defined
   */
  options: Option<TCtx>[] | ((ctx: TCtx) => Option<TCtx>[]);

  /** Don't add automatic back option (even if parent is defined) */
  noBack?: boolean;

  /** Run before entering screen. Return screen ID to navigate immediately. */
  onEnter?: (ctx: TCtx) => Promise<string | void>;

  /** Run when leaving screen */
  onLeave?: (ctx: TCtx) => Promise<void>;
}

// ============================================================================
// App Configuration
// ============================================================================

export interface AppConfig<TCtx> {
  /** App name (technical identifier) */
  name: string;

  /** Display name shown in header (defaults to name). Can be string or function for dynamic titles. */
  displayName?: string | ((ctx: TCtx) => string);

  /** Initial context */
  context: TCtx;

  /** All screens */
  screens: Screen<TCtx>[];

  /** Initial screen ID (default: first screen) */
  initialScreen?: string;

  /** Called on graceful exit (Ctrl+C or exit action) */
  onExit?: (ctx: TCtx) => void;

  /** Custom ESC behavior (default: go back) */
  onEsc?: (ctx: TCtx, screenId: string) => "back" | "stay" | "exit";
}

// ============================================================================
// Runtime State
// ============================================================================

export interface AppState<TCtx> {
  /** Current screen ID */
  current: string;

  /** Mutable context */
  context: TCtx;

  /** Exit requested */
  shouldExit: boolean;

  /** Last selected option value per screen (for cursor restoration) */
  lastSelected: Map<string, string>;
}

// ============================================================================
// Helpers for creating options (reduces boilerplate)
// ============================================================================

/** Create an action option */
export function action<TCtx>(
  value: string,
  label: string,
  run: (ctx: TCtx) => Promise<string | void>,
  description?: string,
): ActionOption<TCtx> {
  return { type: "action", value, label, run, description };
}

/** Create a navigation option */
export function nav(
  value: string,
  label: string,
  to: string,
  opts?: { description?: string; badge?: string },
): NavOption {
  return { type: "nav", value, label, to, ...opts };
}

/** Create a separator */
export function separator(label?: string): Separator {
  return { type: "separator", label };
}

/** Create a back option (usually auto-added) */
export function back(): NavOption {
  return { type: "nav", value: "__back__", label: "← Back", to: "__back__" };
}
