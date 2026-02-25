import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "npm-nvmrc-valid-format";

export const check: Check<NpmContext> = {
  name,
  description: "Check if .nvmrc has valid Node version format",
  tags: ["node", "recommended", "effort:low"],
  run: (_global, { nvmrc }) => {
    if (!nvmrc.raw) return skip(name, "No .nvmrc");
    if (!nvmrc.version) return fail(name, "Empty .nvmrc");

    const version = nvmrc.version;

    // Reject deprecated nvm aliases
    const deprecatedAliases = ["stable", "unstable"];
    if (deprecatedAliases.includes(version)) {
      return fail(
        name,
        `Deprecated alias "${version}". Use "lts/*" or "node" instead`
      );
    }

    const validPatterns = [
      /^\d+$/, // 20
      /^\d+\.\d+$/, // 20.10
      /^\d+\.\d+\.\d+$/, // 20.10.0
      /^v\d+$/, // v20
      /^v\d+\.\d+$/, // v20.10
      /^v\d+\.\d+\.\d+$/, // v20.10.0
      /^lts\/\w+$/, // lts/iron
      /^lts\/\*$/, // lts/* - latest LTS
      /^node$/, // node - latest version
    ];

    const isValid = validPatterns.some((p) => p.test(version));
    if (!isValid) return fail(name, `Invalid format: ${version}`);
    return pass(name, `Version: ${nvmrc.version}`);
  },
};
