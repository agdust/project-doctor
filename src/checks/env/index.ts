import { check as exampleExists } from "./example-exists/check.js";
import { check as exampleNotEmpty } from "./example-not-empty/check.js";

export { loadContext } from "./context.js";

export const checks = [exampleExists, exampleNotEmpty];
