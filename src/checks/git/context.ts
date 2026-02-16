import type { GlobalContext } from "../../types.js";

export interface GitContext {
  isRepo: boolean;
}

export async function loadContext(global: GlobalContext): Promise<GitContext> {
  const isRepo = await global.files.exists(".git");
  return { isRepo };
}
