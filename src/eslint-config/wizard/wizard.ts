import { select, checkbox, confirm } from "@inquirer/prompts";
import type { WizardSelections, PresetId } from "../types.js";
import type { RuleStrictness, RuleConcern } from "../../eslint-db/types.js";

export async function runWizard(): Promise<WizardSelections> {
  console.log();
  console.log("\x1b[1mESLint Configuration Wizard\x1b[0m");
  console.log("\x1b[90mBuild a customized ESLint configuration\x1b[0m");
  console.log();

  // Project type
  const projectType = await select({
    message: "What type of project is this?",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "JavaScript", value: "js" },
    ],
  });

  // Strictness level
  const strictness = await select<RuleStrictness>({
    message: "How strict should the linting be?",
    choices: [
      { name: "Essential - Only catch real bugs", value: "essential" },
      { name: "Recommended - Best practices (default)", value: "recommended" },
      { name: "Strict - Stricter than recommended", value: "strict" },
      { name: "Pedantic - Maximum strictness", value: "pedantic" },
    ],
    default: "recommended",
  });

  // Concerns to include
  const concerns = await checkbox<RuleConcern>({
    message: "Which concerns should be covered?",
    choices: [
      { name: "Error prevention", value: "error-prevention", checked: true },
      { name: "Best practices", value: "best-practice", checked: true },
      { name: "Security", value: "security", checked: true },
      { name: "Performance", value: "performance" },
      { name: "Style (formatting)", value: "style" },
      { name: "Type safety", value: "type-safety", checked: projectType === "ts" },
      { name: "Maintainability", value: "maintainability" },
    ],
  });

  // Type checking
  let typeChecking = false;
  if (projectType === "ts") {
    typeChecking = await confirm({
      message: "Enable type-aware linting? (slower but catches more issues)",
      default: false,
    });
  }

  // Build preset list based on selections
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

  return {
    presets,
    strictness,
    concerns,
    typeChecking,
  };
}

export async function confirmApply(): Promise<boolean> {
  return confirm({
    message: "Apply these changes?",
    default: true,
  });
}

export async function selectPresets(): Promise<PresetId[]> {
  const selected = await checkbox<PresetId>({
    message: "Select presets to include:",
    choices: [
      { name: "Base - Essential error prevention", value: "base", checked: true },
      { name: "TypeScript - TS-specific rules", value: "typescript", checked: true },
      { name: "Strict - Stricter than recommended", value: "strict" },
      { name: "Style - Formatting rules (@stylistic)", value: "style" },
      { name: "Security - Security vulnerability prevention", value: "security" },
      { name: "Performance - Performance optimization", value: "performance" },
    ],
  });

  return selected;
}
