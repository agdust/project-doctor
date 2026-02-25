import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "npm-engines-exists";

export const check: Check<NpmContext> = {
  name,
  description: "Check if engines.node is defined in package.json",
  tags: ["node", "recommended", "effort:medium"],
  run: (_global, { engines }) => {
    if (engines.node === null) {
      return fail(name, "engines.node not defined in package.json");
    }
    return pass(name, `engines.node: ${engines.node}`);
  },
};
