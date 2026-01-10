import { select } from "@inquirer/prompts";
import { CancelPromptError } from "@inquirer/core";
import type {
  WizardStep,
  WizardOptions,
  WizardState,
  WizardStepResult,
  WizardAction,
} from "./types.js";

const BACK_ACTION = "__back__";
const ESC_ACTION = "__esc__";

export class InteractiveWizard<TContext, TAction extends string = string> {
  private steps: WizardStep<TContext, TAction>[];
  private options: Required<WizardOptions<TContext>>;
  private state: WizardState;

  constructor(
    steps: WizardStep<TContext, TAction>[],
    options: WizardOptions<TContext>
  ) {
    this.steps = steps;
    this.options = {
      allowBack: true,
      escAction: ESC_ACTION,
      backLabel: "← Go back",
      onComplete: () => {},
      onCancel: () => {},
      ...options,
    };
    this.state = {
      currentIndex: 0,
      history: [],
      complete: false,
      cancelled: false,
    };
  }

  /**
   * Run the wizard through all steps
   */
  async run(): Promise<WizardState> {
    while (!this.state.complete && !this.state.cancelled) {
      const step = this.steps[this.state.currentIndex];

      // Check if step should be skipped
      if (step.shouldSkip?.(this.options.context)) {
        this.moveForward();
        continue;
      }

      const result = await this.runStep(step);

      if (result.goBack) {
        this.moveBack();
      } else if (result.completed) {
        this.moveForward();
      }
      // If not completed and not going back, step will repeat (onAction returned false)
    }

    if (this.state.complete) {
      this.options.onComplete(this.options.context);
    } else if (this.state.cancelled) {
      this.options.onCancel(this.options.context);
    }

    return this.state;
  }

  /**
   * Run a single step
   */
  private async runStep(
    step: WizardStep<TContext, TAction>
  ): Promise<WizardStepResult> {
    // Render step content
    step.render(
      this.options.context,
      this.state.currentIndex + 1,
      this.steps.length
    );

    // Build choices
    const actions = step.getActions(this.options.context);
    const choices = this.buildChoices(actions);

    // Prompt user
    try {
      const selected = await select({
        message: "What do you want to do?",
        choices,
      });

      // Handle special actions
      if (selected === BACK_ACTION) {
        return { action: BACK_ACTION, completed: false, goBack: true };
      }

      // Handle regular action
      const shouldContinue = await step.onAction(selected as TAction, this.options.context);
      return { action: selected, completed: shouldContinue, goBack: false };
    } catch (error) {
      if (error instanceof CancelPromptError || (error instanceof Error && error.name === "ExitPromptError")) {
        // ESC or Ctrl+C pressed
        return this.handleEscape(step);
      }
      throw error;
    }
  }

  /**
   * Handle ESC key press
   */
  private async handleEscape(
    step: WizardStep<TContext, TAction>
  ): Promise<WizardStepResult> {
    const escAction = this.options.escAction;

    if (escAction === ESC_ACTION) {
      // Default: skip this step
      console.log("     \x1b[90m→ Skipped (ESC)\x1b[0m");
      console.log();
      return { action: ESC_ACTION, completed: true, goBack: false };
    }

    // Custom ESC action - run it through onAction
    const shouldContinue = await step.onAction(escAction as TAction, this.options.context);
    return { action: escAction, completed: shouldContinue, goBack: false };
  }

  /**
   * Build choices array with optional back navigation
   */
  private buildChoices(
    actions: WizardAction<string>[]
  ): Array<{ name: string; value: string; description?: string }> {
    const choices: Array<{ name: string; value: string; description?: string }> = actions.map((action) => ({
      name: action.label,
      value: action.value,
      description: action.description,
    }));

    // Add back option if allowed and not on first step
    if (this.options.allowBack && this.state.history.length > 0) {
      choices.push({
        name: this.options.backLabel,
        value: BACK_ACTION,
        description: undefined,
      });
    }

    return choices;
  }

  /**
   * Move to next step or complete wizard
   */
  private moveForward(): void {
    this.state.history.push(this.state.currentIndex);

    if (this.state.currentIndex >= this.steps.length - 1) {
      this.state.complete = true;
    } else {
      this.state.currentIndex++;
    }
  }

  /**
   * Move back to previous step
   */
  private moveBack(): void {
    const previousIndex = this.state.history.pop();
    if (previousIndex !== undefined) {
      this.state.currentIndex = previousIndex;
    }
  }

  /**
   * Get current wizard state
   */
  getState(): Readonly<WizardState> {
    return { ...this.state };
  }

  /**
   * Get current context
   */
  getContext(): TContext {
    return this.options.context;
  }
}

/**
 * Factory function to create and run a wizard
 */
export async function runWizard<TContext, TAction extends string = string>(
  steps: WizardStep<TContext, TAction>[],
  options: WizardOptions<TContext>
): Promise<WizardState> {
  const wizard = new InteractiveWizard<TContext, TAction>(steps, options);
  return wizard.run();
}
