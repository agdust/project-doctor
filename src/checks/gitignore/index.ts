import { check as exists } from "./exists/check.js";
import { check as hasNodeModules } from "./has-node-modules/check.js";
import { check as noSecretsInGit } from "./no-secrets-in-git/check.js";
import { check as lockfileNotIgnored } from "./lockfile-not-ignored/check.js";

export { loadContext } from "./context.js";

export const checks = [exists, hasNodeModules, noSecretsInGit, lockfileNotIgnored];
