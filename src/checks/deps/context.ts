import type { GlobalContext, PackageJson } from "../../types.js";
import { isIgnored } from "../../utils/gitignore.js";

export interface DepsContext {
  hasPackageLock: boolean;
  hasYarnLock: boolean;
  hasPnpmLock: boolean;
  lockfileType: "npm" | "yarn" | "pnpm" | null;
  /** Content of .npmrc file */
  npmrc: string | null;
  /** Whether .npmrc is gitignored (user stores secrets there) */
  npmrcGitignored: boolean;
  /** devDependencies from package.json */
  devDependencies: Record<string, string>;
  /** scripts from package.json */
  scripts: Record<string, string>;
}

export async function loadContext(global: GlobalContext): Promise<DepsContext> {
  const [hasPackageLock, hasYarnLock, hasPnpmLock, npmrc, gitignore, packageJson] =
    await Promise.all([
      global.files.exists("package-lock.json"),
      global.files.exists("yarn.lock"),
      global.files.exists("pnpm-lock.yaml"),
      global.files.readText(".npmrc"),
      global.files.readText(".gitignore"),
      global.files.readJson<PackageJson>("package.json"),
    ]);

  let lockfileType: "npm" | "yarn" | "pnpm" | null = null;
  if (hasPnpmLock) {
    lockfileType = "pnpm";
  } else if (hasYarnLock) {
    lockfileType = "yarn";
  } else if (hasPackageLock) {
    lockfileType = "npm";
  }

  return {
    hasPackageLock,
    hasYarnLock,
    hasPnpmLock,
    lockfileType,
    npmrc,
    npmrcGitignored: isIgnored(gitignore, ".npmrc"),
    devDependencies: packageJson?.devDependencies ?? {},
    scripts: packageJson?.scripts ?? {},
  };
}
