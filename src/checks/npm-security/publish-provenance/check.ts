/**
 * Check: npm-publish-provenance
 *
 * Verifies that npm publish includes --provenance flag for build attestation.
 * Provenance provides cryptographic proof of build origin and authenticity.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import type { Check } from "../../../types.js";
import type { NpmSecurityContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "npm-security-publish-provenance";

export const check: Check<NpmSecurityContext> = {
  name,
  description: "Check if npm publish uses --provenance for build attestation",
  tags: ["node", "recommended", "effort:low", "security", "source:lirantal-npm-security"],
  run: async (_global, { scripts, ciWorkflows }) => {
    // Check if this is a publishable package
    const hasPublishScript = "publish" in scripts ||
      "prepublishOnly" in scripts ||
      "release" in scripts;

    const hasNpmPublishInCI = ciWorkflows.some((wf) => wf.includes("npm publish"));

    if (!hasPublishScript && !hasNpmPublishInCI) {
      return skip(name, "No npm publish script or CI workflow found");
    }

    // Check for --provenance in scripts
    const hasProvenanceInScripts = Object.values(scripts).some(
      (script) => script.includes("npm publish") && script.includes("--provenance")
    );

    // Check for --provenance in CI workflows
    const hasProvenanceInCI = ciWorkflows.some(
      (wf) => wf.includes("npm publish") && wf.includes("--provenance")
    );

    // Check for id-token: write permission in CI (required for provenance)
    const hasIdTokenPermission = ciWorkflows.some(
      (wf) => wf.includes("id-token") && wf.includes("write")
    );

    if (hasProvenanceInScripts || (hasProvenanceInCI && hasIdTokenPermission)) {
      return pass(name, "npm publish uses --provenance flag");
    }

    if (hasNpmPublishInCI && !hasIdTokenPermission) {
      return fail(name, "CI workflow publishes to npm but lacks id-token: write permission for provenance");
    }

    return fail(name, "npm publish does not use --provenance flag");
  },
};
