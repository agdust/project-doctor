import path from "node:path";
import { createGlobalContext } from "../context/global.js";
import { runAllChecksRaw } from "./runner.js";
import { safeJsonParse } from "./safe-json.js";
import { bold, dim, red, green } from "./colors.js";

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
  let projectName = path.basename(projectPath) || "project";
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
  console.log(`  ${bold(result.projectName)}`);
  console.log();

  // Health checks line
  const { checks } = result;
  if (checks.failed > 0) {
    console.log(`  ${red("✗")} ${checks.failed} check${checks.failed > 1 ? "s" : ""} failing`);
  } else {
    console.log(`  ${green("✓")} All checks passing`);
  }

  console.log();
  console.log(`  ${dim("Run 'project-doctor check' for details")}`);
  console.log(`  ${dim("Run 'project-doctor fix' to fix issues")}`);
  console.log();
}

export async function runOverview(projectPath: string): Promise<void> {
  const result = await getOverview(projectPath);
  printOverview(result);
}
