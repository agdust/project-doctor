import { check as configExists } from "./config-exists/check.js";
import { check as flatConfig } from "./flat-config/check.js";
import { check as noLegacyConfig } from "./no-legacy-config/check.js";

export { loadContext } from "./context.js";

export const checks = [configExists, flatConfig, noLegacyConfig];
