/**
 * Check: deps-disabled-post-install-scripts
 *
 * Verifies that npm is configured to ignore post-install scripts by default.
 * This prevents arbitrary code execution during package installation.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { DepsContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "deps-disabled-post-install-scripts";

export const check: Check<DepsContext> = {
  name,
  description: "Check if npm is configured to ignore post-install scripts",
  tags: [
    TAG.node,
    TAG.recommended,
    TAG.effort.low,
    TAG.security,
    TAG.source["lirantal-npm-security"],
  ],
  run: (_global, { npmrc, npmrcGitignored }) => {
    // Skip if .npmrc is gitignored (user likely stores secrets there and has local-only config)
    if (npmrcGitignored) {
      return skip(name, ".npmrc is gitignored - skipping (local config)");
    }

    if (npmrc === null) {
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
      const npmrcPath = path.join(global.projectPath, ".npmrc");
      let content = "";

      try {
        content = await readFile(npmrcPath, "utf8");
      } catch {
        // File doesn't exist
      }

      // Add ignore-scripts=true
      if (content && !content.endsWith("\n")) {
        content += "\n";
      }
      content += "ignore-scripts=true\n";

      await writeFile(npmrcPath, content, "utf8");

      return {
        success: true,
        message: "Added ignore-scripts=true to .npmrc",
      };
    },
  },
};
