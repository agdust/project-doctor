import type { GlobalContext } from "../../types.js";

export interface TsConfig {
  compilerOptions?: {
    strict?: boolean;
    noImplicitAny?: boolean;
    strictNullChecks?: boolean;
    outDir?: string;
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
  include?: string[];
  exclude?: string[];
}

export interface TsConfigContext {
  raw: string | null;
  parsed: TsConfig | null;
  parseError: string | null;
}

export async function loadContext(global: GlobalContext): Promise<TsConfigContext> {
  const raw = await global.files.readText("tsconfig.json");
  if (!raw) {
    return { raw: null, parsed: null, parseError: null };
  }

  try {
    const parsed = JSON.parse(raw) as TsConfig;
    return { raw, parsed, parseError: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown parse error";
    return { raw, parsed: null, parseError: error };
  }
}
