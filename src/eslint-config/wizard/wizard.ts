/**
 * Wizard helpers for one-shot CLI commands (init, add)
 *
 * These are simpler than the full interactive CLI and are used
 * when running commands like `project-doctor eslint init --wizard`
 */

import {
  select as inquirerSelect,
  checkbox as inquirerCheckbox,
  confirm as inquirerConfirm,
} from "@inquirer/prompts";
import type { WizardSelections, PresetId } from "../types.js";
import type { RuleStrictness, RuleConcern } from "../../eslint-db/types.js";

// User cancelled the wizard
export class WizardCancelledError extends Error {
  constructor() {
    super("Wizard cancelled");
    this.name = "WizardCancelledError";
  }
}

function isCancellation(error: unknown): boolean {
  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const msg = error.message.toLowerCase();
    return (
      name.includes("cancel") ||
      name.includes("exit") ||
      name.includes("abort") ||
      msg.includes("cancel") ||
      msg.includes("abort")
    );
  }
  return false;
}

async function select<T>(message: string, choices: { name: string; value: T }[]): Promise<T> {
  try {
    return await inquirerSelect({ message, choices });
  } catch (error) {
    if (isCancellation(error)) {
      throw new WizardCancelledError();
    }
    throw error;
  }
}

async function checkbox<T>(
  message: string,
  choices: { name: string; value: T; checked?: boolean }[],
): Promise<T[]> {
  try {
    return await inquirerCheckbox({ message, choices });
  } catch (error) {
    if (isCancellation(error)) {
      throw new WizardCancelledError();
    }
    throw error;
  }
}

async function confirm(message: string, defaultValue = true): Promise<boolean> {
  try {
    return await inquirerConfirm({ message, default: defaultValue });
  } catch (error) {
    if (isCancellation(error)) {
      throw new WizardCancelledError();
    }
    throw error;
  }
}

/**
 * Build preset list based on wizard selections
 */
export function buildPresetsFromSelections(
  projectType: "ts" | "js",
  strictness: RuleStrictness,
  concerns: RuleConcern[],
): PresetId[] {
  const presets: PresetId[] = ["base"];

  if (projectType === "ts") {
    presets.push("typescript");
  }

  if (strictness === "strict" || strictness === "pedantic") {
    presets.push("strict");
  }

  if (concerns.includes("style")) {
    presets.push("style");
  }

  if (concerns.includes("security")) {
    presets.push("security");
  }

  if (concerns.includes("performance")) {
    presets.push("performance");
  }

  return presets;
}

export async function runWizard(): Promise<WizardSelections> {
  console.log();
  console.log("\x1b[1mESLint Configuration Wizard\x1b[0m");
  console.log("\x1b[90mBuild a customized ESLint configuration\x1b[0m");
  console.log("\x1b[90mPress Esc or Ctrl+C to cancel\x1b[0m");
  console.log();

  // Project type
  const projectType = await select<"ts" | "js">("What type of project is this?", [
    { name: "TypeScript", value: "ts" },
    { name: "JavaScript", value: "js" },
  ]);

  // Strictness level
  const strictness = await select<RuleStrictness>("How strict should the linting be?", [
    { name: "Essential - Only catch real bugs", value: "essential" },
    { name: "Recommended - Best practices (default)", value: "recommended" },
    { name: "Strict - Stricter than recommended", value: "strict" },
    { name: "Pedantic - Maximum strictness", value: "pedantic" },
  ]);

  // Concerns to include
  const concerns = await checkbox<RuleConcern>("Which concerns should be covered?", [
    { name: "Error prevention", value: "error-prevention", checked: true },
    { name: "Best practices", value: "best-practice", checked: true },
    { name: "Security", value: "security", checked: true },
    { name: "Performance", value: "performance" },
    { name: "Style (formatting)", value: "style" },
    { name: "Type safety", value: "type-safety", checked: projectType === "ts" },
    { name: "Maintainability", value: "maintainability" },
  ]);

  // Type checking
  let typeChecking = false;
  if (projectType === "ts") {
    typeChecking = await confirm(
      "Enable type-aware linting? (slower but catches more issues)",
      false,
    );
  }

  const presets = buildPresetsFromSelections(projectType, strictness, concerns);

  return {
    presets,
    strictness,
    concerns,
    typeChecking,
  };
}

export async function confirmApply(): Promise<boolean> {
  return confirm("Apply these changes?", true);
}

export async function selectPresets(): Promise<PresetId[]> {
  return checkbox<PresetId>("Select presets to include:", [
    { name: "Base - Essential error prevention", value: "base", checked: true },
    { name: "TypeScript - TS-specific rules", value: "typescript", checked: true },
    { name: "Strict - Stricter than recommended", value: "strict" },
    { name: "Style - Formatting rules (@stylistic)", value: "style" },
    { name: "Security - Security vulnerability prevention", value: "security" },
    { name: "Performance - Performance optimization", value: "performance" },
  ]);
}
