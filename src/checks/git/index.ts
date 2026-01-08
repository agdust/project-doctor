import { check as repoExists } from "./repo-exists/check.js";

export { loadContext } from "./context.js";

export const checks = [repoExists];
