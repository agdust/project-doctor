import type { GlobalContext } from "../../types.ts";

export type GitContext = {
  isRepo: boolean;
};

export async function loadContext(global: GlobalContext): Promise<GitContext> {
  const isRepo = await global.files.exists(".git");
  return { isRepo };
}
