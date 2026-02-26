/**
 * Check: docker-devcontainer
 *
 * Verifies that a dev container configuration exists.
 * Dev containers isolate development environments, limiting malware blast radius.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { DockerContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "docker-devcontainer";

export const check: Check<DockerContext> = {
  name,
  description: "Check if dev container configuration exists",
  tags: [
    TAG.node,
    TAG.opinionated,
    TAG.effort.medium,
    TAG.security,
    TAG.source["lirantal-npm-security"],
  ],
  run: (_global, { hasDevcontainer }) => {
    if (hasDevcontainer) {
      return pass(name, "Dev container configuration exists");
    }

    return fail(
      name,
      "No dev container configuration found. See: https://github.com/lirantal/npm-security-best-practices?tab=readme-ov-file#8-work-in-dev-containers",
    );
  },
};
