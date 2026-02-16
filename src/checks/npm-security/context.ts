/**
 * npm Security Context
 *
 * Loads data needed for npm security checks.
 * Based on practices from github.com/lirantal/npm-security-best-practices
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { GlobalContext } from "../../types.js";

type PackageJson = {
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export type NpmSecurityContext = {
  /** Content of .npmrc file */
  npmrc: string | null;
  /** Content of .gitignore file */
  gitignore: string | null;
  /** Whether .devcontainer directory exists */
  hasDevcontainer: boolean;
  /** devDependencies from package.json */
  devDependencies: Record<string, string>;
  /** scripts from package.json */
  scripts: Record<string, string>;
  /** Content of GitHub Actions workflow files */
  ciWorkflows: string[];
  /** Content of pnpm-workspace.yaml or package.json for pnpm config */
  pnpmConfig: string | null;
};

async function loadCIWorkflows(projectPath: string): Promise<string[]> {
  const workflowDir = join(projectPath, ".github", "workflows");
  const workflows: string[] = [];

  try {
    const files = await readdir(workflowDir);
    for (const file of files) {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        try {
          const content = await readFile(join(workflowDir, file), "utf-8");
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

export async function loadContext(global: GlobalContext): Promise<NpmSecurityContext> {
  const npmrc = await global.files.readText(".npmrc");
  const gitignore = await global.files.readText(".gitignore");
  const packageJson = await global.files.readJson<PackageJson>("package.json");

  // Check for devcontainer
  const devcontainerJson = await global.files.readText(".devcontainer/devcontainer.json");
  const hasDevcontainer = devcontainerJson !== null;

  // Load CI workflow files
  const ciWorkflows = await loadCIWorkflows(global.projectPath);

  // Load pnpm config
  const pnpmWorkspace = await global.files.readText("pnpm-workspace.yaml");

  return {
    npmrc,
    gitignore,
    hasDevcontainer,
    devDependencies: packageJson?.devDependencies ?? {},
    scripts: packageJson?.scripts ?? {},
    ciWorkflows,
    pnpmConfig: pnpmWorkspace,
  };
}
