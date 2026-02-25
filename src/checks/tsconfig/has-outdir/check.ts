import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "tsconfig-has-outdir";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if tsconfig.json has outDir configured",
  tags: ["typescript", "recommended", "effort:low"],
  run: (_global, { parsed }) => {
    if (!parsed) return skip(name, "No tsconfig.json");
    if (!parsed.compilerOptions?.outDir) {
      return fail(name, "No outDir configured");
    }
    return pass(name, `outDir: ${parsed.compilerOptions.outDir}`);
  },
  fix: {
    description: "Set outDir to dist",
    run: async (global) => {
      const tsconfig = await readJson<Record<string, unknown>>(global.projectPath, "tsconfig.json");
      if (!tsconfig) return { success: false, message: "Could not read tsconfig.json" };

      setNestedField(tsconfig, "compilerOptions.outDir", "dist");
      await writeJson(global.projectPath, "tsconfig.json", tsconfig);
      return { success: true, message: "Set outDir: dist" };
    },
  },
};
