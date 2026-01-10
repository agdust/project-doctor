/**
 * Interactive Wizard Module
 *
 * A reusable multi-step interactive prompt system with:
 * - ESC key handling (skip or custom action)
 * - Back navigation to previous steps
 * - Step history tracking
 * - Customizable actions per step
 *
 * @example
 * ```typescript
 * import { runWizard, WizardStep } from "./interactive-wizard";
 *
 * type MyContext = { items: string[]; fixed: number };
 *
 * const steps: WizardStep<MyContext>[] = [
 *   {
 *     id: "step-1",
 *     render: (ctx, current, total) => {
 *       console.log(`Step ${current}/${total}: Fix item`);
 *     },
 *     getActions: () => [
 *       { value: "fix", label: "Apply fix" },
 *       { value: "skip", label: "Skip" },
 *     ],
 *     onAction: async (action, ctx) => {
 *       if (action === "fix") ctx.fixed++;
 *       return true; // continue to next step
 *     },
 *   },
 * ];
 *
 * await runWizard(steps, {
 *   context: { items: ["a", "b"], fixed: 0 },
 *   allowBack: true,
 * });
 * ```
 */

export { InteractiveWizard, runWizard } from "./wizard.js";
export type {
  WizardAction,
  WizardStep,
  WizardStepResult,
  WizardOptions,
  WizardState,
} from "./types.js";
