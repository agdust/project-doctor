import { check as knipInstalled } from "./knip-installed/check.js";
import { check as knipConfig } from "./knip-config/check.js";

export { loadContext } from "./context.js";

export const checks = [knipInstalled, knipConfig];
