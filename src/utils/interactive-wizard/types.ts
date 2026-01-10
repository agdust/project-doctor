/**
 * Interactive Wizard - Reusable multi-step prompt system with navigation
 *
 * Features:
 * - ESC to skip/cancel
 * - Back navigation to previous steps
 * - Step history tracking
 * - Customizable actions per step
 */

export type WizardAction<T extends string = string> = {
  /** Unique identifier for this action */
  value: T;
  /** Display label in the menu */
  label: string;
  /** Optional description shown below label */
  description?: string;
};

export type WizardStepResult<T extends string = string> = {
  /** The action that was selected */
  action: T;
  /** Whether the step was completed (false if skipped via ESC) */
  completed: boolean;
  /** Whether user requested to go back */
  goBack: boolean;
};

export type WizardStep<TContext, TAction extends string = string> = {
  /** Unique identifier for this step */
  id: string;
  /** Render the step header/content before showing options */
  render: (context: TContext, stepIndex: number, totalSteps: number) => void;
  /** Get available actions for this step */
  getActions: (context: TContext) => WizardAction<TAction>[];
  /** Handle the selected action, return true to continue, false to repeat step */
  onAction: (action: TAction, context: TContext) => Promise<boolean>;
  /** Optional: determine if this step should be skipped */
  shouldSkip?: (context: TContext) => boolean;
};

export type WizardOptions<TContext> = {
  /** Initial context passed to all steps */
  context: TContext;
  /** Allow going back to previous steps */
  allowBack?: boolean;
  /** Action value to use when ESC is pressed (default: skip step) */
  escAction?: string;
  /** Message to show for back option */
  backLabel?: string;
  /** Callback when wizard completes */
  onComplete?: (context: TContext) => void;
  /** Callback when wizard is cancelled (Ctrl+C) */
  onCancel?: (context: TContext) => void;
};

export type WizardState = {
  /** Current step index */
  currentIndex: number;
  /** History of visited step indices */
  history: number[];
  /** Whether wizard is complete */
  complete: boolean;
  /** Whether wizard was cancelled */
  cancelled: boolean;
};
