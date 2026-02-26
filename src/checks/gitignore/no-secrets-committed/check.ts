import path from "node:path";
import { TAG, type Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readFileWithLineEnding, atomicWriteFile } from "../../../utils/safe-fs.js";

const name = "gitignore-no-secrets-committed";

// Files that are always secret and should be gitignored
const SECRET_FILES = [".env", ".env.local", "credentials.json", "secrets.json"];

// Patterns that indicate .npmrc contains auth tokens
// See: https://docs.npmjs.com/cli/v10/configuring-npm/npmrc#auth-related-configuration
const NPMRC_AUTH_PATTERNS = [
  /_authToken\s*=/i, // //registry.npmjs.org/:_authToken=xxx
  /_auth\s*=/i, // _auth=base64string (legacy)
  /_password\s*=/i, // //registry.npmjs.org/:_password=xxx
  /\/\/[^:]+:_authToken/i, // Scoped auth token pattern
];

/**
 * Check if .npmrc contains authentication tokens
 */
function npmrcHasAuthTokens(content: string): boolean {
  return NPMRC_AUTH_PATTERNS.some((pattern) => pattern.test(content));
}

export const check: Check<GitignoreContext> = {
  name,
  description: "Check that common secret files are ignored",
  tags: [TAG.universal, TAG.required, TAG.effort.medium],
  run: async (global, { raw, gitignore }) => {
    if (raw === null || gitignore === null) {
      return skip(name, "No .gitignore");
    }

    const notIgnored: string[] = [];

    // Check standard secret files
    for (const file of SECRET_FILES) {
      const exists = await global.files.exists(file);
      if (exists && !gitignore.ignores(file)) {
        notIgnored.push(file);
      }
    }

    // Special handling for .npmrc - only flag if it contains auth tokens
    const npmrcContent = await global.files.readText(".npmrc");
    if (npmrcContent !== null && npmrcHasAuthTokens(npmrcContent) && !gitignore.ignores(".npmrc")) {
      notIgnored.push(".npmrc (contains auth tokens)");
    }

    if (notIgnored.length > 0) {
      return fail(name, `Secret files not ignored: ${notIgnored.join(", ")}`);
    }
    return pass(name, "Secret files properly ignored");
  },
  fix: {
    description: "Add secret files to .gitignore",
    run: async (global, { gitignore }) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const { content, lineEnding } = await readFileWithLineEnding(gitignorePath);

      // Find which secret files exist but aren't ignored
      const toAdd: string[] = [];
      for (const file of SECRET_FILES) {
        const exists = await global.files.exists(file);
        if (exists && gitignore && !gitignore.ignores(file)) {
          toAdd.push(file);
        }
      }

      // Special handling for .npmrc with auth tokens
      const npmrcContent = await global.files.readText(".npmrc");
      if (
        npmrcContent !== null &&
        npmrcHasAuthTokens(npmrcContent) &&
        gitignore !== null &&
        !gitignore.ignores(".npmrc")
      ) {
        toAdd.push(".npmrc");
      }

      if (toAdd.length === 0) {
        return { success: true, message: "No secret files to add" };
      }

      // Append to .gitignore with a comment, preserving line endings
      const addition = `${lineEnding}# Secret files${lineEnding}${toAdd.join(lineEnding)}${lineEnding}`;
      const newContent =
        content.endsWith("\n") || content.endsWith("\r\n")
          ? content + addition
          : content + lineEnding + addition;
      await atomicWriteFile(gitignorePath, newContent);

      return { success: true, message: `Added: ${toAdd.join(", ")}` };
    },
  },
};
