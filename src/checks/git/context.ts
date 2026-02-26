import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { GlobalContext } from "../../types.js";

export interface GitContext {
  isRepo: boolean;
  /** Content of GitHub Actions workflow files */
  ciWorkflows: string[];
}

async function loadCIWorkflows(projectPath: string): Promise<string[]> {
  const workflowDir = path.join(projectPath, ".github", "workflows");
  const workflows: string[] = [];

  try {
    const files = await readdir(workflowDir);
    for (const file of files) {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        try {
          const content = await readFile(path.join(workflowDir, file), "utf8");
          workflows.push(content);
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // Directory doesn't exist or isn't readable
  }

  return workflows;
}

export async function loadContext(global: GlobalContext): Promise<GitContext> {
  const [isRepo, ciWorkflows] = await Promise.all([
    global.files.exists(".git"),
    loadCIWorkflows(global.projectPath),
  ]);
  return { isRepo, ciWorkflows };
}
