import type { GlobalContext, PackageJson } from "../../types.js";
import { safeJsonParse } from "../../utils/safe-json.js";

export interface PackageJsonContext {
  raw: string | null;
  parsed: PackageJson | null;
  parseError: string | null;
}

export async function loadContext(global: GlobalContext): Promise<PackageJsonContext> {
  const raw = await global.files.readText("package.json");
  if (raw === null) {
    return { raw: null, parsed: null, parseError: null };
  }

  const parsed = safeJsonParse<PackageJson>(raw);
  if (!parsed) {
    return { raw, parsed: null, parseError: "Invalid JSON" };
  }
  return { raw, parsed, parseError: null };
}
