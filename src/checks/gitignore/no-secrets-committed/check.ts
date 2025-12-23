import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-no-secrets-committed";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check that common secret files are ignored",
  tags: ["universal", "required"],
  run: async (global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");

    const secretFiles = [".env", ".env.local", "credentials.json", "secrets.json", ".npmrc"];
    const notIgnored: string[] = [];

    for (const file of secretFiles) {
      const exists = await global.files.exists(file);
      if (exists) {
        const isIgnored = patterns.some((p) => p === file || file.match(new RegExp(`^${p.replace("*", ".*")}$`)));
        if (!isIgnored) {
          notIgnored.push(file);
        }
      }
    }

    if (notIgnored.length > 0) {
      return fail(name, `Secret files not ignored: ${notIgnored.join(", ")}`);
    }
    return pass(name, "Secret files properly ignored");
  },
};
