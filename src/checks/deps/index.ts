import { check as lockfileExists } from "./lockfile-exists/check.js";
import { check as knipInstalled } from "./knip-installed/check.js";
import { check as knipConfig } from "./knip-config/check.js";
import { check as disabledPostInstallScripts } from "./disabled-post-install-scripts/check.js";
import { check as lockfileLint } from "./lockfile-lint/check.js";

export { loadContext } from "./context.js";

export const checks = [lockfileExists, knipInstalled, knipConfig, disabledPostInstallScripts, lockfileLint];
