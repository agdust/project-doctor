import type { GlobalContext } from "../../types.js";

export interface EditorconfigContext {
  raw: string | null;
  hasRoot: boolean;
  hasIndent: boolean;
}

export async function loadContext(global: GlobalContext): Promise<EditorconfigContext> {
  const raw = await global.files.readText(".editorconfig");
  if (!raw) {
    return { raw: null, hasRoot: false, hasIndent: false };
  }

  const hasRoot = raw.includes("root = true") || raw.includes("root=true");
  const hasIndent = raw.includes("indent_style") || raw.includes("indent_size");

  return { raw, hasRoot, hasIndent };
}
