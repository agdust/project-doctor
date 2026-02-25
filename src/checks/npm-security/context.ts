/**
 * npm Security Context
 *
 * Loads data needed for npm security checks.
 * Based on practices from github.com/lirantal/npm-security-best-practices
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { GlobalContext } from "../../types.js";
import { isIgnored, parseGitignore, type GitignoreInstance } from "../../utils/gitignore.js";

interface PackageJson {
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface NpmSecurityContext {
  /** Content of .npmrc file */
  npmrc: string | null;
  /** Whether .npmrc is gitignored (user stores secrets there) */
  npmrcGitignored: boolean;
  /** Content of .gitignore file */
  gitignore: string | null;
  /** Parsed gitignore instance for path checking */
  gitignoreInstance: GitignoreInstance | null;
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

export async function loadContext(global: GlobalContext): Promise<NpmSecurityContext> {
  const npmrc = await global.files.readText(".npmrc");
  const gitignore = await global.files.readText(".gitignore");
  const packageJson = await global.files.readJson<PackageJson>("package.json");

  // Parse gitignore for path checking
  const gitignoreInstance = gitignore === null ? null : parseGitignore(gitignore);

  // Check for devcontainer
  const devcontainerJson = await global.files.readText(".devcontainer/devcontainer.json");
  const hasDevcontainer = devcontainerJson !== null;

  // Load CI workflow files
  const ciWorkflows = await loadCIWorkflows(global.projectPath);

  // Load pnpm config
  const pnpmWorkspace = await global.files.readText("pnpm-workspace.yaml");

  return {
    npmrc,
    npmrcGitignored: isIgnored(gitignore, ".npmrc"),
    gitignore,
    gitignoreInstance,
    hasDevcontainer,
    devDependencies: packageJson?.devDependencies ?? {},
    scripts: packageJson?.scripts ?? {},
    ciWorkflows,
    pnpmConfig: pnpmWorkspace,
  };
}
