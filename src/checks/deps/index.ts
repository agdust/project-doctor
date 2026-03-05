import { check as lockfileExists } from "./lockfile-exists/check.js";
import { check as disabledPostInstallScripts } from "./disabled-post-install-scripts/check.js";
import { check as lockfileLint } from "./lockfile-lint/check.js";

export { loadContext } from "./context.js";

export const checks = [lockfileExists, disabledPostInstallScripts, lockfileLint];
