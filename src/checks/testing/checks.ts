import type { Check, CheckResult } from "../../types.ts";
import type { TestingContext } from "./context.ts";

function pass(name: string, message: string): CheckResult {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResult {
  return { name, status: "fail", message };
}

export const jestConfigExists: Check<TestingContext> = {
  name: "jest-config-exists",
  description: "Check if Jest is configured",
  tags: ["node", "recommended", "tool:jest"],
  run: async (_global, { hasJest }) => {
    if (!hasJest) return fail("jest-config-exists", "No jest.config.js");
    return pass("jest-config-exists", "Jest configured");
  },
};

export const vitestConfigExists: Check<TestingContext> = {
  name: "vitest-config-exists",
  description: "Check if Vitest is configured",
  tags: ["node", "recommended", "tool:vitest"],
  run: async (_global, { hasVitest }) => {
    if (!hasVitest) return fail("vitest-config-exists", "No vitest.config.ts");
    return pass("vitest-config-exists", "Vitest configured");
  },
};

export const playwrightConfigExists: Check<TestingContext> = {
  name: "playwright-config-exists",
  description: "Check if Playwright is configured",
  tags: ["node", "recommended", "tool:playwright"],
  run: async (_global, { hasPlaywright }) => {
    if (!hasPlaywright) return fail("playwright-config-exists", "No playwright.config.ts");
    return pass("playwright-config-exists", "Playwright configured");
  },
};

export const cypressConfigExists: Check<TestingContext> = {
  name: "cypress-config-exists",
  description: "Check if Cypress is configured",
  tags: ["node", "recommended", "tool:cypress"],
  run: async (_global, { hasCypress }) => {
    if (!hasCypress) return fail("cypress-config-exists", "No cypress.config.ts");
    return pass("cypress-config-exists", "Cypress configured");
  },
};

export const checks = [
  jestConfigExists,
  vitestConfigExists,
  playwrightConfigExists,
  cypressConfigExists,
];
