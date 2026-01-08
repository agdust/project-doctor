import type { GlobalContext } from "../../types.js";

type PackageJson = {
  engines?: {
    node?: string;
    npm?: string;
  };
};

export type NpmContext = {
  nvmrc: {
    raw: string | null;
    version: string | null;
  };
  engines: {
    node: string | null;
    npm: string | null;
  };
};

export async function loadContext(global: GlobalContext): Promise<NpmContext> {
  // Load .nvmrc
  const nvmrcRaw = await global.files.readText(".nvmrc");
  const nvmrc = {
    raw: nvmrcRaw,
    version: nvmrcRaw ? nvmrcRaw.trim() : null,
  };

  // Load engines from package.json
  const packageJson = await global.files.readJson<PackageJson>("package.json");
  const engines = {
    node: packageJson?.engines?.node ?? null,
    npm: packageJson?.engines?.npm ?? null,
  };

  return { nvmrc, engines };
}
