import type { GlobalContext } from "../../types.js";

export type DepsContext = {
  hasPackageLock: boolean;
  hasYarnLock: boolean;
  hasPnpmLock: boolean;
  lockfileType: "npm" | "yarn" | "pnpm" | null;
};

export async function loadContext(global: GlobalContext): Promise<DepsContext> {
  const [hasPackageLock, hasYarnLock, hasPnpmLock] = await Promise.all([
    global.files.exists("package-lock.json"),
    global.files.exists("yarn.lock"),
    global.files.exists("pnpm-lock.yaml"),
  ]);

  let lockfileType: "npm" | "yarn" | "pnpm" | null = null;
  if (hasPnpmLock) lockfileType = "pnpm";
  else if (hasYarnLock) lockfileType = "yarn";
  else if (hasPackageLock) lockfileType = "npm";

  return { hasPackageLock, hasYarnLock, hasPnpmLock, lockfileType };
}
