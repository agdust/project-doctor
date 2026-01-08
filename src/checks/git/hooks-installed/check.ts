import type { Check } from "../../../types.js";
import type { GitContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "git-hooks-installed";

export const check: Check<GitContext> = {
  name,
  description: "Check for git hooks setup (husky, lefthook, etc.)",
  tags: ["universal", "recommended", "effort:medium"],
  run: async (global, { isRepo }) => {
    if (!isRepo) return skip(name, "Not a git repo");

    const [hasHusky, hasLefthook, hasSimpleGitHooks] = await Promise.all([
      global.files.exists(".husky"),
      global.files.exists("lefthook.yml"),
      global.files.exists(".simple-git-hooks.json"),
    ]);

    if (hasHusky || hasLefthook || hasSimpleGitHooks) {
      return pass(name, "Git hooks configured");
    }
    return fail(name, "No git hooks setup found");
  },
};
