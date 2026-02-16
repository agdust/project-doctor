/**
 * Check: devcontainer-exists
 *
 * Verifies that a dev container configuration exists.
 * Dev containers isolate development environments, limiting malware blast radius.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { NpmSecurityContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "npm-security-devcontainer";

const DEFAULT_DEVCONTAINER = `{
  "name": "Node.js",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:22",
  "postCreateCommand": "npm ci",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint"
      ]
    }
  }
}
`;

export const check: Check<NpmSecurityContext> = {
  name,
  description: "Check if dev container configuration exists",
  tags: ["universal", "opinionated", "effort:medium", "security", "source:lirantal-npm-security"],
  run: async (_global, { hasDevcontainer }) => {
    if (hasDevcontainer) {
      return pass(name, "Dev container configuration exists");
    }

    return fail(name, "No dev container configuration found");
  },
  fix: {
    description: "Create basic dev container configuration",
    run: async (global) => {
      const devcontainerDir = join(global.projectPath, ".devcontainer");
      const devcontainerPath = join(devcontainerDir, "devcontainer.json");

      await mkdir(devcontainerDir, { recursive: true });
      await writeFile(devcontainerPath, DEFAULT_DEVCONTAINER, "utf-8");

      return {
        success: true,
        message: "Created .devcontainer/devcontainer.json",
      };
    },
  },
};
