import { createGlobalContext } from "../context/global.js";
import { runAllChecksRaw } from "./runner.js";
import { getProjectName } from "./project-name.js";
import { bold, dim, red, green } from "./colors.js";
import { blank } from "../cli-framework/renderer.js";

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
  const projectName = await getProjectName(global, projectPath);

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
  blank();
  console.log(`  ${bold(result.projectName)}`);
  blank();

  // Health checks line
  const { checks } = result;
  if (checks.failed > 0) {
    console.log(`  ${red("✗")} ${checks.failed} check${checks.failed > 1 ? "s" : ""} failing`);
  } else {
    console.log(`  ${green("✓")} All checks passing`);
  }

  blank();
  console.log(`  ${dim("Run 'project-doctor check' for details")}`);
  console.log(`  ${dim("Run 'project-doctor fix' to fix issues")}`);
  blank();
}

export async function runOverview(projectPath: string): Promise<void> {
  const result = await getOverview(projectPath);
  printOverview(result);
}
