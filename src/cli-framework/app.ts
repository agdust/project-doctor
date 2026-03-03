/**
 * CLI App - Core runtime engine
 *
 * Manages navigation, input handling, and screen lifecycle.
 * Declarative config in, interactive app out.
 */

import { select, Separator as InquirerSeparator } from "@inquirer/prompts";
import { CancelPromptError } from "@inquirer/core";
import type { AppConfig, AppState, Screen, Option } from "./types.js";
import { back } from "./helpers.js";
import { clear, bigTitle, blank } from "./renderer.js";

export const BACK_VALUE = "__back__";
export const EXIT_VALUE = "__exit__";

/** ESC key behavior options */
export const ESC_BEHAVIOR = {
  back: "back",
  exit: "exit",
  stay: "stay",
} as const;

export class App<TCtx> {
  private readonly config: AppConfig<TCtx>;
  private readonly state: AppState<TCtx>;
  private readonly screenMap: Map<string, Screen<TCtx>>;

  constructor(config: AppConfig<TCtx>) {
    this.config = config;
    this.screenMap = new Map(config.screens.map((s) => [s.id, s]));

    if (!Array.isArray(config.screens) || config.screens.length === 0) {
      throw new Error("No screens defined");
    }

    const initialScreen = config.initialScreen ?? config.screens[0].id;

    this.state = {
      current: initialScreen,
      context: config.context,
      shouldExit: false,
      lastSelected: new Map(),
    };
  }

  /**
   * Run the app - main loop
   */
  async run(): Promise<void> {
    while (!this.state.shouldExit) {
      const screen = this.screenMap.get(this.state.current);
      if (!screen) {
        throw new Error(`Screen not found: ${this.state.current}`);
      }

      await this.runScreen(screen);
    }

    // Graceful exit
    this.config.onExit?.(this.state.context);
  }

  /**
   * Run a single screen iteration
   */
  private async runScreen(screen: Screen<TCtx>): Promise<void> {
    // Lifecycle: onEnter - can return next screen to navigate immediately
    const nextScreen = await screen.onEnter?.(this.state.context);
    if (nextScreen !== undefined) {
      this.state.current = nextScreen;
      return;
    }

    // Clear screen and show app header
    clear();
    const displayName =
      typeof this.config.displayName === "function"
        ? this.config.displayName(this.state.context)
        : (this.config.displayName ?? this.config.name);
    bigTitle(displayName);
    blank();

    // Render screen content
    screen.render(this.state.context);

    // Get options (static or dynamic)
    const baseOptions =
      typeof screen.options === "function" ? screen.options(this.state.context) : screen.options;

    // Auto-add back option unless noBack or at root
    const options = this.addBackOption(screen, baseOptions);

    // Build choices for inquirer
    const choices = this.buildChoices(options);

    // Set up ESC and Ctrl+C handling with raw stdin for immediate response
    const abortController = new AbortController();
    let escPressed = false;
    let ctrlCPressed = false;

    const onData = (data: Buffer) => {
      if (data.length === 0) {
        return;
      }
      // ESC key is 0x1b (27)
      if (data[0] === 0x1b && data.length === 1) {
        escPressed = true;
        abortController.abort();
      }
      // Ctrl+C is 0x03
      if (data[0] === 0x03) {
        ctrlCPressed = true;
        abortController.abort();
      }
    };

    // Get last selected value for cursor restoration
    const defaultValue = this.state.lastSelected.get(screen.id);

    // Start the select prompt first, THEN add our ESC listener
    // This prevents interfering with inquirer's keyboard initialization
    const selectPromise = select(
      {
        message: "",
        choices,
        loop: false,
        // Disable search to prevent buffered input from resetting cursor position
        // (search with empty string matches first item, causing cursor jump)
        theme: { prefix: "", keybindings: ["vim"] },
        default: defaultValue,
      },
      { signal: abortController.signal },
    );

    // Add ESC listener after inquirer has set up its keyboard handling
    setImmediate(() => {
      process.stdin.on("data", onData);
    });

    // Prompt and handle selection
    try {
      const selected = await selectPromise;

      // Save selected value for cursor restoration when returning (but not "back")
      if (selected !== BACK_VALUE) {
        this.state.lastSelected.set(screen.id, selected);
      }

      await this.handleSelection(screen, options, selected);
    } catch (error) {
      // Ctrl+C exits immediately
      if (ctrlCPressed) {
        this.state.shouldExit = true;
      } else if (
        escPressed ||
        error instanceof CancelPromptError ||
        (error instanceof Error && error.name === "ExitPromptError") ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        await this.handleEscape(screen);
      } else {
        throw error;
      }
    } finally {
      process.stdin.removeListener("data", onData);
    }
  }

  /**
   * Add back option if appropriate
   */
  private addBackOption(screen: Screen<TCtx>, options: Option<TCtx>[]): Option<TCtx>[] {
    if (screen.noBack === true || screen.parent === undefined) {
      return options;
    }
    return [...options, back()];
  }

  /**
   * Build inquirer choices from options
   */
  private buildChoices(options: Option<TCtx>[]) {
    return options.map((opt) => {
      if (opt.type === "separator") {
        return new InquirerSeparator(opt.label);
      }

      let name = opt.label;
      if (opt.type === "nav" && opt.badge !== undefined) {
        name = `${opt.label} (${opt.badge})`;
      }

      return {
        name,
        value: opt.value,
        description: opt.description,
      };
    });
  }

  /**
   * Handle user selection
   */
  private async handleSelection(
    screen: Screen<TCtx>,
    options: Option<TCtx>[],
    selected: string,
  ): Promise<void> {
    // Handle back navigation
    if (selected === BACK_VALUE) {
      await this.goBack(screen);
      return;
    }

    // Find the selected option
    const option = options.find((o) => o.type !== "separator" && o.value === selected);
    if (!option || option.type === "separator") {
      return;
    }

    if (option.type === "nav") {
      await this.navigate(screen, option.to);
    } else if (option.type === "action") {
      const nextScreen = await option.run(this.state.context);
      if (nextScreen === EXIT_VALUE) {
        this.state.shouldExit = true;
      } else if (nextScreen !== undefined) {
        await this.navigate(screen, nextScreen);
      }
      // If no nextScreen returned, stay on current screen (will re-render)
    }
  }

  /**
   * Handle ESC key
   */
  private async handleEscape(screen: Screen<TCtx>): Promise<void> {
    const behavior = this.config.onEsc?.(this.state.context, screen.id) ?? ESC_BEHAVIOR.back;

    switch (behavior) {
      case ESC_BEHAVIOR.back: {
        await this.goBack(screen);
        break;
      }
      case ESC_BEHAVIOR.exit: {
        this.state.shouldExit = true;
        break;
      }
      case ESC_BEHAVIOR.stay: {
        // Do nothing, screen will re-render
        break;
      }
    }
  }

  /**
   * Navigate to a screen
   */
  private async navigate(fromScreen: Screen<TCtx>, toScreenId: string): Promise<void> {
    // Lifecycle: onLeave
    await fromScreen.onLeave?.(this.state.context);

    this.state.current = toScreenId;
  }

  /**
   * Go back to parent screen, or exit if at root
   */
  private async goBack(currentScreen: Screen<TCtx>): Promise<void> {
    if (currentScreen.parent === undefined) {
      // At root - ESC exits the app
      this.state.shouldExit = true;
      return;
    }

    // Lifecycle: onLeave
    await currentScreen.onLeave?.(this.state.context);

    // Go to parent
    this.state.current = currentScreen.parent;
  }

  /**
   * Exit the app gracefully
   */
  exit(): void {
    this.state.shouldExit = true;
  }

  /**
   * Get current context (for external access)
   */
  getContext(): TCtx {
    return this.state.context;
  }

  /**
   * Get current screen ID
   */
  getCurrentScreen(): string {
    return this.state.current;
  }
}

/**
 * Create and run an app
 */
export async function runApp<TCtx>(config: AppConfig<TCtx>): Promise<void> {
  const app = new App(config);
  await app.run();
}
