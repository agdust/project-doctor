import { check as sizeLimitInstalled } from "./size-limit-installed/check.js";
import { check as sizeLimitConfigured } from "./size-limit-configured/check.js";
import { check as sizeLimitScript } from "./size-limit-script/check.js";

export { loadContext } from "./context.js";

export const checks = [sizeLimitInstalled, sizeLimitConfigured, sizeLimitScript];
