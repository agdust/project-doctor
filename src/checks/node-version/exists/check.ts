import { writeFile } from "node:fs/promises";
import path from "node:path";
import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { NodeVersionContext } from "../context.js";
import { pass, fail } from "../../helpers.js";
import { CURRENT_LTS_MAJOR } from "../constants.js";

const name = "node-version-nvmrc-exists";

export const check: Check<NodeVersionContext> = {
  name,
  description: "Check if .nvmrc file exists",
  tags: [TAG.node, TAG.recommended, TAG.effort.low],
  run: (_global, { nvmrc }) => {
    if (nvmrc.raw === null) {
      return fail(name, ".nvmrc not found");
    }
    return pass(name, ".nvmrc exists");
  },
  fix: {
    description: `Create .nvmrc with Node ${CURRENT_LTS_MAJOR} (current LTS)`,
    run: async (global) => {
      const nvmrcPath = path.join(global.projectPath, ".nvmrc");
      await writeFile(nvmrcPath, `${CURRENT_LTS_MAJOR}\n`, "utf8");
      return {
        success: true,
        message: `Created .nvmrc with Node ${CURRENT_LTS_MAJOR}`,
      };
    },
  },
};
