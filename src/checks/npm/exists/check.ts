import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail } from "../../helpers.js";
import { CURRENT_LTS_MAJOR } from "../constants.js";

const name = "npm-nvmrc-exists";

export const check: Check<NpmContext> = {
  name,
  description: "Check if .nvmrc file exists",
  tags: ["node", "recommended"],
  run: async (_global, { nvmrc }) => {
    if (!nvmrc.raw) return fail(name, ".nvmrc not found");
    return pass(name, ".nvmrc exists");
  },
  fix: {
    description: `Create .nvmrc with Node ${CURRENT_LTS_MAJOR} (current LTS)`,
    run: async (global) => {
      const nvmrcPath = join(global.projectPath, ".nvmrc");
      await writeFile(nvmrcPath, `${CURRENT_LTS_MAJOR}\n`, "utf-8");
      return {
        success: true,
        message: `Created .nvmrc with Node ${CURRENT_LTS_MAJOR}`,
      };
    },
  },
};
