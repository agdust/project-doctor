import type { GlobalContext } from "../../types.ts";

export type EslintContext = {
  hasFlatConfig: boolean;
  hasLegacyConfig: boolean;
  hasIgnore: boolean;
};

export async function loadContext(global: GlobalContext): Promise<EslintContext> {
  const [hasFlatConfig, hasLegacyJson, hasLegacyJs, hasIgnore] = await Promise.all([
    global.files.exists("eslint.config.js"),
    global.files.exists(".eslintrc.json"),
    global.files.exists(".eslintrc.js"),
    global.files.exists(".eslintignore"),
  ]);

  return {
    hasFlatConfig,
    hasLegacyConfig: hasLegacyJson || hasLegacyJs,
    hasIgnore,
  };
}
