/**
 * Manual Check: publish-provenance
 *
 * Verifies that npm publish includes --provenance flag for build attestation.
 * This is a manual check because provenance setup involves CI configuration
 * that can't be reliably auto-detected from just file contents.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import { TAG } from "../../types.js";
import type { ManualCheck } from "../../types.js";

export const check: ManualCheck = {
  name: "publish-provenance",
  description: "npm publish uses --provenance for build attestation",
  details: `Verify that your CI/CD publish workflow includes the --provenance flag for npm publish.

Requirements:
- npm CLI 9.5.0 or later
- Supported CI/CD platform (GitHub Actions, GitLab CI, etc.)
- Package published to the public npm registry

In GitHub Actions, add id-token: write permission and use --provenance:

  permissions:
    id-token: write
    contents: read

  steps:
    - run: npm publish --provenance

Or in package.json scripts:

  "scripts": {
    "publish": "npm publish --provenance"
  }

Users can verify provenance on npmjs.com by checking the "Provenance" badge.`,
  tags: [TAG.node, TAG.recommended, TAG.effort.low, TAG.security],
  why: "Provenance attestations provide cryptographic proof of where and how a package was built. This helps users verify that the package they're installing actually came from the claimed source repository and CI system.",
};
