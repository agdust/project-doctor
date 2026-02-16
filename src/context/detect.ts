import type { DetectedTools, FileCache } from "../types.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

export async function detectTools(files: FileCache): Promise<DetectedTools> {
  const [
    packageJson,
    hasPackageLock,
    hasYarnLock,
    hasPnpmLock,
    hasTsconfig,
    hasEslintConfig,
    hasEslintConfigJs,
    hasPrettierrc,
    hasPrettierrcJson,
    hasDockerfile,
    hasJscpdJson,
    hasJscpdrc,
  ] = await Promise.all([
    files.readJson<PackageJson>("package.json"),
    files.exists("package-lock.json"),
    files.exists("yarn.lock"),
    files.exists("pnpm-lock.yaml"),
    files.exists("tsconfig.json"),
    files.exists("eslint.config.js"),
    files.exists(".eslintrc.json"),
    files.exists(".prettierrc"),
    files.exists(".prettierrc.json"),
    files.exists("Dockerfile"),
    files.exists(".jscpd.json"),
    files.exists(".jscpdrc"),
  ]);

  const allDeps = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
  };

  const packageManager = hasPnpmLock
    ? "pnpm"
    : hasYarnLock
      ? "yarn"
      : hasPackageLock
        ? "npm"
        : null;

  return {
    packageManager,
    hasTypeScript: hasTsconfig || "typescript" in allDeps,
    hasEslint: hasEslintConfig || hasEslintConfigJs || "eslint" in allDeps,
    hasPrettier: hasPrettierrc || hasPrettierrcJson || "prettier" in allDeps,
    hasDocker: hasDockerfile,
    hasKnip: "knip" in allDeps,
    hasSizeLimit: "size-limit" in allDeps,
    hasJscpd: hasJscpdJson || hasJscpdrc || "jscpd" in allDeps,
    isMonorepo: Boolean(packageJson?.workspaces),
  };
}
