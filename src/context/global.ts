import type { GlobalContext } from "../types.ts";
import { createFileCache } from "./file-cache.ts";
import { detectTools } from "./detect.ts";

export async function createGlobalContext(projectPath: string): Promise<GlobalContext> {
  const files = createFileCache(projectPath);
  const detected = await detectTools(files);

  return {
    projectPath,
    detected,
    files,
  };
}
