import { readdir } from "node:fs/promises";
import path from "node:path";
import type { GlobalContext, FileCache } from "../../types.js";

export interface GitContext {
  isRepo: boolean;
  /** Content of GitHub Actions workflow files */
  ciWorkflows: string[];
}

async function loadCIWorkflows(projectPath: string, files: FileCache): Promise<string[]> {
  const workflowDir = path.join(projectPath, ".github", "workflows");
  const workflows: string[] = [];

  try {
    const dirFiles = await readdir(workflowDir);
    for (const file of dirFiles) {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        const relativePath = path.join(".github", "workflows", file);
        const content = await files.readText(relativePath);
        if (content !== null) {
          workflows.push(content);
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
    loadCIWorkflows(global.projectPath, global.files),
  ]);
  return { isRepo, ciWorkflows };
}
