import { check as exists } from "./exists/check.js";
import { check as hasRoot } from "./has-root/check.js";
import { check as hasIndent } from "./has-indent/check.js";

export { loadContext } from "./context.js";

export const checks = [exists, hasRoot, hasIndent];
