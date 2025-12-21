import type { GlobalContext } from "../../types.ts";

export type TestingContext = {
  hasJest: boolean;
  hasVitest: boolean;
  hasPlaywright: boolean;
  hasCypress: boolean;
};

export async function loadContext(global: GlobalContext): Promise<TestingContext> {
  const [hasJestConfig, hasVitestConfig, hasPlaywrightConfig, hasCypressConfig] = await Promise.all([
    global.files.exists("jest.config.js"),
    global.files.exists("vitest.config.ts"),
    global.files.exists("playwright.config.ts"),
    global.files.exists("cypress.config.ts"),
  ]);

  return {
    hasJest: hasJestConfig,
    hasVitest: hasVitestConfig,
    hasPlaywright: hasPlaywrightConfig,
    hasCypress: hasCypressConfig,
  };
}
