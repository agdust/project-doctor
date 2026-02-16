import type { GlobalContext } from "../../types.js";

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  type?: "module" | "commonjs";
  main?: string;
  exports?: unknown;
  engines?: { node?: string };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

export interface PackageJsonContext {
  raw: string | null;
  parsed: PackageJson | null;
  parseError: string | null;
}

export async function loadContext(global: GlobalContext): Promise<PackageJsonContext> {
  const raw = await global.files.readText("package.json");
  if (!raw) {
    return { raw: null, parsed: null, parseError: null };
  }

  try {
    const parsed = JSON.parse(raw) as PackageJson;
    return { raw, parsed, parseError: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown parse error";
    return { raw, parsed: null, parseError: error };
  }
}
