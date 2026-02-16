/**
 * Check: npm-security-disabled-node-post-install-scripts
 *
 * Verifies that npm is configured to ignore post-install scripts by default.
 * This prevents arbitrary code execution during package installation.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { NpmSecurityContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "npm-security-disabled-node-post-install-scripts";

export const check: Check<NpmSecurityContext> = {
  name,
  description: "Check if npm is configured to ignore post-install scripts",
  tags: ["node", "recommended", "effort:low", "security", "source:lirantal-npm-security"],
  run: async (_global, { npmrc }) => {
    if (!npmrc) {
      return fail(name, ".npmrc not found - post-install scripts are enabled by default");
    }

    // Check for ignore-scripts=true
    const hasIgnoreScripts = /^\s*ignore-scripts\s*=\s*true\s*$/m.test(npmrc);

    if (hasIgnoreScripts) {
      return pass(name, "Post-install scripts are disabled in .npmrc");
    }

    return fail(name, "Post-install scripts are not disabled in .npmrc");
  },
  fix: {
    description: "Add ignore-scripts=true to .npmrc",
    run: async (global) => {
      const npmrcPath = join(global.projectPath, ".npmrc");
      let content = "";

      try {
        content = await readFile(npmrcPath, "utf-8");
      } catch {
        // File doesn't exist
      }

      // Add ignore-scripts=true
      if (content && !content.endsWith("\n")) {
        content += "\n";
      }
      content += "ignore-scripts=true\n";

      await writeFile(npmrcPath, content, "utf-8");

      return {
        success: true,
        message: "Added ignore-scripts=true to .npmrc",
      };
    },
  },
};
