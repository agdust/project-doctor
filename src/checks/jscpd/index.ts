import { check as configExists } from "./config-exists/check.js";

export { loadContext } from "./context.js";

export const checks = [configExists];
