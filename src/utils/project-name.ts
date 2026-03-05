/**
 * Get project name from package.json or folder basename.
 */

import path from "node:path";
import type { GlobalContext } from "../types.js";
import { safeJsonParse } from "./safe-json.js";

export async function getProjectName(global: GlobalContext, projectPath: string): Promise<string> {
  const pkgContent = await global.files.readText("package.json");
  if (pkgContent !== null) {
    const pkg = safeJsonParse<{ name?: string }>(pkgContent);
    if (pkg && typeof pkg.name === "string") {
      return pkg.name;
    }
  }
  return path.basename(projectPath) || "project";
}
