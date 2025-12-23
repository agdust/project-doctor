import { check as configExists } from "./config-exists/check.js";
import { check as ignoreExists } from "./ignore-exists/check.js";

export { loadContext } from "./context.js";

export const checks = [configExists, ignoreExists];
