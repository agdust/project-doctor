import type { GlobalContext } from "../../types.js";

export type NvmrcContext = {
  raw: string | null;
  version: string | null;
};

export async function loadContext(global: GlobalContext): Promise<NvmrcContext> {
  const raw = await global.files.readText(".nvmrc");
  if (!raw) {
    return { raw: null, version: null };
  }

  const version = raw.trim();
  return { raw, version };
}
