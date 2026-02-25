import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "tsconfig-paths-valid";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if path aliases have baseUrl configured",
  tags: ["typescript", "recommended", "effort:low"],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No tsconfig.json");
    }
    const opts = parsed.compilerOptions;
    if (opts?.paths !== undefined && opts?.baseUrl === undefined) {
      return fail(name, "paths defined but no baseUrl");
    }
    return pass(name, "Path config valid");
  },
  fix: {
    description: "Add baseUrl for path aliases",
    run: async (global) => {
      const tsconfig = await readJson<Record<string, unknown>>(global.projectPath, "tsconfig.json");
      if (!tsconfig) {
        return { success: false, message: "Could not read tsconfig.json" };
      }

      setNestedField(tsconfig, "compilerOptions.baseUrl", ".");
      await writeJson(global.projectPath, "tsconfig.json", tsconfig);
      return { success: true, message: "Added baseUrl: ." };
    },
  },
};
