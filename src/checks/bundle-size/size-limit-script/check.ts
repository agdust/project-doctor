import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { BundleSizeContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "size-limit-script";

export const check: Check<BundleSizeContext> = {
  name,
  description: "Check if package.json has a size-limit npm script",
  tags: [TAG.node, TAG.recommended, TAG.tool["size-limit"], TAG.effort.low],
  run: (global, ctx) => {
    if (!global.detected.hasSizeLimit) {
      return skip(name, "size-limit not installed");
    }

    if (!ctx.hasSizeLimitScript) {
      return fail(name, 'no npm script runs size-limit (e.g. "size": "size-limit")');
    }

    return pass(name, "size-limit script found in package.json");
  },
  fix: {
    description: 'Add "size" script to package.json',
    run: async (global) => {
      const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
      if (!pkg) {
        return { success: false, message: "Could not read package.json" };
      }

      setNestedField(pkg, "scripts.size", "size-limit");
      await writeJson(global.projectPath, "package.json", pkg);
      return { success: true, message: 'Added script "size": "size-limit"' };
    },
  },
};
