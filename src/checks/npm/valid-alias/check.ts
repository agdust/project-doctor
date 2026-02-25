import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { ALL_LTS_CODENAMES } from "../constants.js";

const name = "npm-nvmrc-valid-alias";

export const check: Check<NpmContext> = {
  name,
  description: "Check if .nvmrc uses valid LTS codename",
  tags: ["node", "recommended", "effort:low"],
  run: (_global, { nvmrc }) => {
    if (nvmrc.version === null) {
      return skip(name, "No .nvmrc");
    }

    const match = /^lts\/(\w+)$/i.exec(nvmrc.version);
    if (!match) {
      return skip(name, "Not an LTS alias");
    }

    const codename = match[1].toLowerCase();
    if (codename === "*") {
      return pass(name, "Using lts/*");
    }

    if (!ALL_LTS_CODENAMES.includes(codename as (typeof ALL_LTS_CODENAMES)[number])) {
      return fail(name, `Unknown LTS codename: ${codename}`);
    }

    return pass(name, `Valid codename: ${codename}`);
  },
};
