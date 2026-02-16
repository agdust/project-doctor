import type { GlobalContext } from "../../types.js";

export interface PrettierContext {
  hasConfig: boolean;
  hasIgnore: boolean;
}

export async function loadContext(global: GlobalContext): Promise<PrettierContext> {
  const [hasPrettierrc, hasPrettierrcJson, hasPrettierConfig, hasIgnore] = await Promise.all([
    global.files.exists(".prettierrc"),
    global.files.exists(".prettierrc.json"),
    global.files.exists("prettier.config.js"),
    global.files.exists(".prettierignore"),
  ]);

  return {
    hasConfig: hasPrettierrc || hasPrettierrcJson || hasPrettierConfig,
    hasIgnore,
  };
}
