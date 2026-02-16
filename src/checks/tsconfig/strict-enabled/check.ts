import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "tsconfig-strict-enabled";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if TypeScript strict mode is enabled",
  tags: ["typescript", "recommended", "effort:high"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No tsconfig.json");
    if (!parsed.compilerOptions?.strict) {
      return fail(name, "strict mode not enabled");
    }
    return pass(name, "strict mode enabled");
  },
  fix: {
    description: "Enable strict mode",
    run: async (global) => {
      const tsconfig = await readJson<Record<string, unknown>>(global.projectPath, "tsconfig.json");
      if (!tsconfig) return { success: false, message: "Could not read tsconfig.json" };

      setNestedField(tsconfig, "compilerOptions.strict", true);
      await writeJson(global.projectPath, "tsconfig.json", tsconfig);
      return { success: true, message: "Enabled strict mode" };
    },
  },
};
