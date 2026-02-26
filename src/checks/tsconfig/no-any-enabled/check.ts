import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "tsconfig-no-any-enabled";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if noImplicitAny is enabled",
  tags: [TAG.typescript, TAG.opinionated, TAG.effort.high],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No tsconfig.json");
    }
    const opts = parsed.compilerOptions;
    if (opts?.strict !== true && opts?.noImplicitAny !== true) {
      return fail(name, "noImplicitAny not enabled");
    }
    return pass(name, "noImplicitAny enabled");
  },
  fix: {
    description: "Enable noImplicitAny",
    run: async (global) => {
      const tsconfig = await readJson<Record<string, unknown>>(global.projectPath, "tsconfig.json");
      if (!tsconfig) {
        return { success: false, message: "Could not read tsconfig.json" };
      }

      setNestedField(tsconfig, "compilerOptions.noImplicitAny", true);
      await writeJson(global.projectPath, "tsconfig.json", tsconfig);
      return { success: true, message: "Enabled noImplicitAny" };
    },
  },
};
