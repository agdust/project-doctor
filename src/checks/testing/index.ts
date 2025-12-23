import { check as jestConfigExists } from "./jest-config-exists/check.js";
import { check as vitestConfigExists } from "./vitest-config-exists/check.js";
import { check as playwrightConfigExists } from "./playwright-config-exists/check.js";
import { check as cypressConfigExists } from "./cypress-config-exists/check.js";

export { loadContext } from "./context.js";

export const checks = [
  jestConfigExists,
  vitestConfigExists,
  playwrightConfigExists,
  cypressConfigExists,
];
