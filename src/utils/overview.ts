import { createGlobalContext } from "../context/global.js";
import { checkDeps, type AuditResult } from "./deps-checker.js";
import { runAllChecksRaw } from "./runner.js";
import { safeJsonParse } from "./safe-json.js";

interface OverviewResult {
  projectName: string;
  checks: {
    total: number;
    passed: number;
    failed: number;
  };
  deps: {
    total: number;
    outdated: number;
    major: number;
    minor: number;
    patch: number;
  } | null;
  audit: AuditResult | null;
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

  // Check dependencies
  let depsResult: OverviewResult["deps"] = null;
  let auditResult: AuditResult | null = null;
  try {
    const deps = await checkDeps({ projectPath });
    depsResult = {
      total: deps.outdated.length + deps.upToDate,
      outdated: deps.outdated.length,
      major: deps.outdated.filter((d) => d.updateType === "major").length,
      minor: deps.outdated.filter((d) => d.updateType === "minor").length,
      patch: deps.outdated.filter((d) => d.updateType === "patch").length,
    };
    auditResult = deps.audit;
  } catch {
    // No package.json or other error
  }

  return {
    projectName,
    checks: {
      total: checkResults.length,
      passed: checkResults.filter((r) => r.status === "pass").length,
      failed: checkResults.filter((r) => r.status === "fail").length,
    },
    deps: depsResult,
    audit: auditResult,
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

  // Dependencies line
  if (result.deps) {
    const { deps } = result;
    if (deps.outdated > 0) {
      const parts: string[] = [];
      if (deps.major > 0) parts.push(`${deps.major} major`);
      if (deps.minor > 0) parts.push(`${deps.minor} minor`);
      if (deps.patch > 0) parts.push(`${deps.patch} patch`);
      console.log(
        `  \x1b[33m↑\x1b[0m ${deps.outdated} outdated dependenc${deps.outdated > 1 ? "ies" : "y"} (${parts.join(", ")})`,
      );
    } else {
      console.log("  \x1b[32m✓\x1b[0m Dependencies up to date");
    }
  }

  // Vulnerabilities line
  if (result.audit) {
    const { audit } = result;
    if (audit.total === 0) {
      console.log("  \x1b[32m✓\x1b[0m No vulnerabilities");
    } else {
      const parts: string[] = [];
      if (audit.critical > 0) parts.push(`${audit.critical} critical`);
      if (audit.high > 0) parts.push(`${audit.high} high`);
      if (audit.moderate > 0) parts.push(`${audit.moderate} moderate`);
      if (audit.low > 0) parts.push(`${audit.low} low`);
      const color = audit.critical > 0 || audit.high > 0 ? "\x1b[31m" : "\x1b[33m";
      console.log(
        `  ${color}⚠\x1b[0m ${audit.total} vulnerabilit${audit.total > 1 ? "ies" : "y"} (${parts.join(", ")})`,
      );
    }
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
