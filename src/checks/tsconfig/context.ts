import type { GlobalContext } from "../../types.js";
import { safeJsonParse } from "../../utils/safe-json.js";

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

  const parsed = safeJsonParse<TsConfig>(raw);
  if (!parsed) {
    return { raw, parsed: null, parseError: "Invalid JSON" };
  }
  return { raw, parsed, parseError: null };
}
