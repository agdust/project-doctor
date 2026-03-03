import type { GlobalContext, PackageJson } from "../../types.js";

export interface NodeVersionContext {
  nvmrc: {
    raw: string | null;
    version: string | null;
  };
  engines: {
    node: string | null;
    npm: string | null;
  };
}

export async function loadContext(global: GlobalContext): Promise<NodeVersionContext> {
  // Load .nvmrc
  const nvmrcRaw = await global.files.readText(".nvmrc");
  const nvmrc = {
    raw: nvmrcRaw,
    version: nvmrcRaw === null ? null : nvmrcRaw.trim(),
  };

  // Load engines from package.json
  const packageJson = await global.files.readJson<PackageJson>("package.json");
  const engines = {
    node: packageJson?.engines?.node ?? null,
    npm: packageJson?.engines?.npm ?? null,
  };

  return { nvmrc, engines };
}
