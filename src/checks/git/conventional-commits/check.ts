import type { Check } from "../../../types.js";
import type { GitContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "conventional-commits";

export const check: Check<GitContext> = {
  name,
  description: "Check if commitlint or conventional commit tooling is configured",
  tags: ["universal", "opinionated"],
  run: async (global, { isRepo }) => {
    if (!isRepo) return skip(name, "Not a git repo");

    const [hasCommitlint, hasCommitlintConfig] = await Promise.all([
      global.files.exists("commitlint.config.js"),
      global.files.exists(".commitlintrc.json"),
    ]);

    if (hasCommitlint || hasCommitlintConfig) {
      return pass(name, "Commitlint configured");
    }
    return fail(name, "No conventional commit tooling");
  },
};
