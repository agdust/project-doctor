import { readFile } from "node:fs/promises";
import { join } from "node:path";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type VersionInfo = {
  name: string;
  current: string;
  latest: string;
  type: "dependencies" | "devDependencies";
  updateType: "major" | "minor" | "patch" | "prerelease" | "unknown";
};

type DepsCheckResult = {
  outdated: VersionInfo[];
  upToDate: number;
  failed: string[];
};

function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  // Remove ^ ~ >= etc
  const cleaned = version.replace(/^[\^~>=<]+/, "");
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function getUpdateType(current: string, latest: string): VersionInfo["updateType"] {
  const currentParsed = parseVersion(current);
  const latestParsed = parseVersion(latest);

  if (!currentParsed || !latestParsed) return "unknown";

  if (latestParsed.major > currentParsed.major) return "major";
  if (latestParsed.minor > currentParsed.minor) return "minor";
  if (latestParsed.patch > currentParsed.patch) return "patch";

  return "unknown";
}

async function fetchLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}

export type DepsCheckerOptions = {
  projectPath: string;
  includeDev?: boolean;
};

export async function checkDeps(options: DepsCheckerOptions): Promise<DepsCheckResult> {
  const { projectPath, includeDev = true } = options;
  const packageJsonPath = join(projectPath, "package.json");

  let pkg: PackageJson;
  try {
    const content = await readFile(packageJsonPath, "utf-8");
    pkg = JSON.parse(content);
  } catch {
    throw new Error("Could not read package.json");
  }

  const deps: { name: string; version: string; type: "dependencies" | "devDependencies" }[] = [];

  if (pkg.dependencies) {
    for (const [name, version] of Object.entries(pkg.dependencies)) {
      deps.push({ name, version, type: "dependencies" });
    }
  }

  if (includeDev && pkg.devDependencies) {
    for (const [name, version] of Object.entries(pkg.devDependencies)) {
      deps.push({ name, version, type: "devDependencies" });
    }
  }

  const outdated: VersionInfo[] = [];
  const failed: string[] = [];
  let upToDate = 0;

  // Process in batches to avoid overwhelming the registry
  const batchSize = 10;
  for (let i = 0; i < deps.length; i += batchSize) {
    const batch = deps.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (dep) => {
        const latest = await fetchLatestVersion(dep.name);
        return { dep, latest };
      })
    );

    for (const { dep, latest } of results) {
      if (!latest) {
        failed.push(dep.name);
        continue;
      }

      const currentClean = dep.version.replace(/^[\^~>=<]+/, "");
      if (currentClean === latest) {
        upToDate++;
        continue;
      }

      // Check if it's actually outdated (not just different format)
      const currentParsed = parseVersion(dep.version);
      const latestParsed = parseVersion(latest);

      if (currentParsed && latestParsed) {
        const isOutdated =
          latestParsed.major > currentParsed.major ||
          latestParsed.minor > currentParsed.minor ||
          latestParsed.patch > currentParsed.patch;

        if (!isOutdated) {
          upToDate++;
          continue;
        }
      }

      outdated.push({
        name: dep.name,
        current: dep.version,
        latest,
        type: dep.type,
        updateType: getUpdateType(dep.version, latest),
      });
    }
  }

  // Sort by update type (major first), then by name
  outdated.sort((a, b) => {
    const typeOrder = { major: 0, minor: 1, patch: 2, prerelease: 3, unknown: 4 };
    const typeDiff = typeOrder[a.updateType] - typeOrder[b.updateType];
    if (typeDiff !== 0) return typeDiff;
    return a.name.localeCompare(b.name);
  });

  return { outdated, upToDate, failed };
}

export function printDepsReport(result: DepsCheckResult): void {
  const { outdated, upToDate, failed } = result;

  console.log();

  if (outdated.length === 0) {
    console.log("  \x1b[32m✓ All dependencies are up to date\x1b[0m");
    console.log();
    return;
  }

  console.log(`  Found \x1b[1m${outdated.length}\x1b[0m outdated package${outdated.length > 1 ? "s" : ""}`);
  console.log();

  // Group by update type
  const major = outdated.filter((d) => d.updateType === "major");
  const minor = outdated.filter((d) => d.updateType === "minor");
  const patch = outdated.filter((d) => d.updateType === "patch");
  const other = outdated.filter((d) => d.updateType === "unknown" || d.updateType === "prerelease");

  const printSection = (items: VersionInfo[], label: string, color: string) => {
    if (items.length === 0) return;
    console.log(`  ${color}${label}\x1b[0m`);
    for (const dep of items) {
      const devLabel = dep.type === "devDependencies" ? " \x1b[90m(dev)\x1b[0m" : "";
      console.log(`    ${dep.name}${devLabel}`);
      console.log(`      \x1b[90m${dep.current}\x1b[0m → \x1b[32m${dep.latest}\x1b[0m`);
    }
    console.log();
  };

  printSection(major, "Major updates (breaking changes possible)", "\x1b[31m");
  printSection(minor, "Minor updates (new features)", "\x1b[33m");
  printSection(patch, "Patch updates (bug fixes)", "\x1b[32m");
  printSection(other, "Other updates", "\x1b[90m");

  // Summary
  console.log("  \x1b[90m─────────────────────────────────────────\x1b[0m");
  console.log();
  console.log(`  \x1b[1mSummary\x1b[0m`);
  console.log(`    ${outdated.length} outdated`);
  console.log(`    ${upToDate} up to date`);
  if (failed.length > 0) {
    console.log(`    ${failed.length} failed to check`);
  }
  console.log();
}

export async function runDepsChecker(options: DepsCheckerOptions): Promise<void> {
  console.log();
  console.log("  \x1b[90mChecking dependencies...\x1b[0m");

  const result = await checkDeps(options);
  printDepsReport(result);
}
