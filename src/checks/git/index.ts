import { check as repoExists } from "./repo-exists/check.js";
import { check as ciLockfile } from "./ci-lockfile/check.js";

export { loadContext } from "./context.js";

export const checks = [repoExists, ciLockfile];
