import { checkGroups } from "../registry.js";
import { createGlobalContext } from "../context/global.js";
import { checkDeps } from "./deps-checker.js";
import type { CheckResultBase, GlobalContext } from "../types.js";

type OverviewResult = {
  projectName: string;
  checks: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  deps: {
    total: number;
    outdated: number;
    major: number;
    minor: number;
    patch: number;
  } | null;
};

export async function getOverview(projectPath: string): Promise<OverviewResult> {
  const global = await createGlobalContext(projectPath);

  // Get project name
  let projectName = projectPath.split("/").pop() ?? "project";
  try {
    const pkgContent = await global.files.readText("package.json");
    if (pkgContent) {
      const pkg = JSON.parse(pkgContent);
      if (pkg.name) projectName = pkg.name;
    }
  } catch {
    // Use folder name
  }

  // Run all checks
  const checkResults: CheckResultBase[] = [];
  for (const group of checkGroups) {
    const groupContext = await group.loadContext(global);
    for (const check of group.checks) {
      const result = await (check.run as (g: GlobalContext, c: unknown) => Promise<CheckResultBase>)(
        global,
        groupContext
      );
      checkResults.push(result);
    }
  }

  // Check dependencies
  let depsResult: OverviewResult["deps"] = null;
  try {
    const deps = await checkDeps({ projectPath });
    depsResult = {
      total: deps.outdated.length + deps.upToDate,
      outdated: deps.outdated.length,
      major: deps.outdated.filter((d) => d.updateType === "major").length,
      minor: deps.outdated.filter((d) => d.updateType === "minor").length,
      patch: deps.outdated.filter((d) => d.updateType === "patch").length,
    };
  } catch {
    // No package.json or other error
  }

  return {
    projectName,
    checks: {
      total: checkResults.length,
      passed: checkResults.filter((r) => r.status === "pass").length,
      failed: checkResults.filter((r) => r.status === "fail").length,
      warnings: checkResults.filter((r) => r.status === "warn").length,
    },
    deps: depsResult,
  };
}

export function printOverview(result: OverviewResult): void {
  console.log();
  console.log(`  \x1b[1m${result.projectName}\x1b[0m`);
  console.log();

  // Health checks line
  const { checks } = result;
  if (checks.failed > 0) {
    console.log(`  \x1b[31m✗\x1b[0m ${checks.failed} check${checks.failed > 1 ? "s" : ""} failing`);
  } else {
    console.log(`  \x1b[32m✓\x1b[0m All checks passing`);
  }

  if (checks.warnings > 0) {
    console.log(`  \x1b[33m!\x1b[0m ${checks.warnings} warning${checks.warnings > 1 ? "s" : ""}`);
  }

  // Dependencies line
  if (result.deps) {
    const { deps } = result;
    if (deps.outdated > 0) {
      const parts: string[] = [];
      if (deps.major > 0) parts.push(`${deps.major} major`);
      if (deps.minor > 0) parts.push(`${deps.minor} minor`);
      if (deps.patch > 0) parts.push(`${deps.patch} patch`);
      console.log(`  \x1b[33m↑\x1b[0m ${deps.outdated} outdated dependenc${deps.outdated > 1 ? "ies" : "y"} (${parts.join(", ")})`);
    } else {
      console.log(`  \x1b[32m✓\x1b[0m Dependencies up to date`);
    }
  }

  console.log();
  console.log(`  \x1b[90mRun 'project-doctor check' for details\x1b[0m`);
  console.log(`  \x1b[90mRun 'project-doctor fix' to fix issues\x1b[0m`);
  console.log();
}

export async function runOverview(projectPath: string): Promise<void> {
  const result = await getOverview(projectPath);
  printOverview(result);
}
