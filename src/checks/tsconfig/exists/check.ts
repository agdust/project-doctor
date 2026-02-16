import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "tsconfig-exists";

const DEFAULT_TSCONFIG = {
  compilerOptions: {
    target: "ES2022",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    outDir: "dist",
    declaration: true,
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"],
};

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if tsconfig.json exists",
  tags: ["typescript", "required", "effort:medium"],
  run: async (_global, { raw }) => {
    if (!raw) return fail(name, "tsconfig.json not found");
    return pass(name, "tsconfig.json exists");
  },
  fix: {
    description: "Create tsconfig.json with Node.js defaults",
    run: async (global) => {
      const tsconfigPath = join(global.projectPath, "tsconfig.json");
      const content = JSON.stringify(DEFAULT_TSCONFIG, null, 2) + "\n";
      await writeFile(tsconfigPath, content, "utf-8");
      return { success: true, message: "Created tsconfig.json" };
    },
  },
};
