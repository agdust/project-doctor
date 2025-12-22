import type { GlobalContext } from "../../types.js";

export type EslintContext = {
  hasFlatConfig: boolean;
  flatConfigFile: string | null;
  hasLegacyConfig: boolean;
  hasIgnore: boolean;
};

const FLAT_CONFIG_FILES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
  "eslint.config.cts",
] as const;

const LEGACY_CONFIG_FILES = [
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yaml",
  ".eslintrc.yml",
] as const;

export async function loadContext(global: GlobalContext): Promise<EslintContext> {
  const flatConfigChecks = await Promise.all(
    FLAT_CONFIG_FILES.map(async (file) => ({
      file,
      exists: await global.files.exists(file),
    }))
  );

  const legacyConfigChecks = await Promise.all(
    LEGACY_CONFIG_FILES.map((file) => global.files.exists(file))
  );

  const flatConfigMatch = flatConfigChecks.find((c) => c.exists);
  const hasIgnore = await global.files.exists(".eslintignore");

  return {
    hasFlatConfig: flatConfigMatch !== undefined,
    flatConfigFile: flatConfigMatch?.file ?? null,
    hasLegacyConfig: legacyConfigChecks.some(Boolean),
    hasIgnore,
  };
}
