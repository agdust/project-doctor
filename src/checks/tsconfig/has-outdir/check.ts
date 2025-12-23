import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "tsconfig-has-outdir";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if tsconfig.json has outDir configured",
  tags: ["typescript", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No tsconfig.json");
    if (!parsed.compilerOptions?.outDir) {
      return fail(name, "No outDir configured");
    }
    return pass(name, `outDir: ${parsed.compilerOptions.outDir}`);
  },
};
