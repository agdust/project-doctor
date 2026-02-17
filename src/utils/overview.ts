import { createGlobalContext } from "../context/global.js";
import { runAllChecksRaw } from "./runner.js";
import { safeJsonParse } from "./safe-json.js";

interface OverviewResult {
  projectName: string;
  checks: {
    total: number;
    passed: number;
    failed: number;
  };
}

export async function getOverview(projectPath: string): Promise<OverviewResult> {
  const global = await createGlobalContext(projectPath);

  // Get project name
  let projectName = projectPath.split("/").pop() ?? "project";
  const pkgContent = await global.files.readText("package.json");
  if (pkgContent) {
    const pkg = safeJsonParse<{ name?: string }>(pkgContent);
    if (pkg && typeof pkg.name === "string") projectName = pkg.name;
  }

  // Run all checks
  const checkResults = await runAllChecksRaw(global);

  return {
    projectName,
    checks: {
      total: checkResults.length,
      passed: checkResults.filter((r) => r.status === "pass").length,
      failed: checkResults.filter((r) => r.status === "fail").length,
    },
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
    console.log("  \x1b[32m✓\x1b[0m All checks passing");
  }

  console.log();
  console.log("  \x1b[90mRun 'project-doctor check' for details\x1b[0m");
  console.log("  \x1b[90mRun 'project-doctor fix' to fix issues\x1b[0m");
  console.log();
}

export async function runOverview(projectPath: string): Promise<void> {
  const result = await getOverview(projectPath);
  printOverview(result);
}
