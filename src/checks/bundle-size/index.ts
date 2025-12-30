import { check as sizeLimitInstalled } from "./size-limit-installed/check.js";
import { check as sizeLimitConfigured } from "./size-limit-configured/check.js";

export { loadContext } from "./context.js";

export const checks = [sizeLimitInstalled, sizeLimitConfigured];
