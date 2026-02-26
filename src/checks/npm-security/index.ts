/**
 * npm Security Checks
 *
 * Security best practices for npm package management.
 * Based on: https://github.com/lirantal/npm-security-best-practices
 */

import { check as disabledNodePostInstallScripts } from "./disabled-node-post-install-scripts/check.js";
import { check as lockfileLint } from "./lockfile-lint/check.js";
import { check as devcontainer } from "./devcontainer/check.js";
import { check as ciLockfile } from "./ci-lockfile/check.js";

export { loadContext } from "./context.js";

export const checks = [
  disabledNodePostInstallScripts,
  lockfileLint,
  devcontainer,
  ciLockfile,
];
