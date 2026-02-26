/**
 * Check: deps-lockfile-lint
 *
 * Verifies that lockfile-lint is set up to prevent lockfile injection attacks.
 * Attackers can modify lockfiles in PRs to inject compromised packages.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { DepsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "deps-lockfile-lint";

export const check: Check<DepsContext> = {
  name,
  description: "Check if lockfile-lint is configured to prevent lockfile injection",
  tags: [
    TAG.node,
    TAG.recommended,
    TAG.effort.low,
    TAG.security,
    TAG.source["lirantal-npm-security"],
  ],
  run: (_global, { devDependencies, scripts }) => {
    const hasLockfileLint = "lockfile-lint" in devDependencies;

    if (!hasLockfileLint) {
      return fail(name, "lockfile-lint not found in devDependencies");
    }

    // Check if there's a script that runs lockfile-lint
    const hasLintScript = Object.values(scripts).some((script) => script.includes("lockfile-lint"));

    if (!hasLintScript) {
      return fail(name, "lockfile-lint installed but no script configured to run it");
    }

    return pass(name, "lockfile-lint is configured");
  },
};
