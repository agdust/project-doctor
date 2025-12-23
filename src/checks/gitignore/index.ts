import { check as exists } from "./exists/check.js";
import { check as hasNodeModules } from "./has-node-modules/check.js";
import { check as hasDist } from "./has-dist/check.js";
import { check as hasEnv } from "./has-env/check.js";
import { check as noDuplicates } from "./no-duplicates/check.js";
import { check as noSecretsCommitted } from "./no-secrets-committed/check.js";

export { loadContext } from "./context.js";

export const checks = [
  exists,
  hasNodeModules,
  hasDist,
  hasEnv,
  noDuplicates,
  noSecretsCommitted,
];
