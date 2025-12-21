import type { GlobalContext } from "../../types.ts";

export type GitignoreContext = {
  raw: string | null;
  patterns: string[];
};

export async function loadContext(global: GlobalContext): Promise<GitignoreContext> {
  const raw = await global.files.readText(".gitignore");
  if (!raw) {
    return { raw: null, patterns: [] };
  }

  const patterns = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  return { raw, patterns };
}
