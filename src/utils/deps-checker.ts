import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createNpmCache, computeLockfileHash, type NpmCache } from "./npm-cache.js";

const execFileAsync = promisify(execFile);

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface VersionInfo {
  name: string;
  current: string;
  latest: string;
  type: "dependencies" | "devDependencies";
  updateType: "major" | "minor" | "patch" | "prerelease" | "unknown";
}

export interface AuditResult {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
}

export interface DepsCheckResult {
  outdated: VersionInfo[];
  upToDate: number;
  failed: string[];
  audit: AuditResult | null;
}

function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  // Remove ^ ~ >= etc
  const cleaned = version.replace(/^[\^~>=<]+/, "");
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(cleaned);
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

async function fetchLatestVersion(
  packageName: string,
  cache: NpmCache | null,
): Promise<string | null> {
  // Try cache first
  if (cache) {
    const cached = cache.getVersion(packageName);
    if (cached) return cached;
  }

  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: string };
    const version = typeof data.version === "string" ? data.version : null;

    // Cache the result
    if (version && cache) {
      cache.setVersion(packageName, version);
    }

    return version;
  } catch {
    return null;
  }
}

export interface DepsCheckerOptions {
  projectPath: string;
  includeDev?: boolean;
  noCache?: boolean;
}

export async function checkDeps(options: DepsCheckerOptions): Promise<DepsCheckResult> {
  const { projectPath, includeDev = true, noCache = false } = options;
  const packageJsonPath = join(projectPath, "package.json");

  // Initialize cache (unless bypassed)
  const cache = noCache ? null : await createNpmCache(projectPath);
  const lockfileHash = noCache ? "" : await computeLockfileHash(projectPath);

  let pkg: PackageJson;
  try {
    const content = await readFile(packageJsonPath, "utf-8");
    pkg = JSON.parse(content) as PackageJson;
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
        const latest = await fetchLatestVersion(dep.name, cache);
        return { dep, latest };
      }),
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

  // Run npm audit
  const audit = await runAudit(projectPath, cache, lockfileHash);

  // Flush cache to disk
  if (cache) {
    await cache.flush();
  }

  return { outdated, upToDate, failed, audit };
}

async function runAudit(
  projectPath: string,
  cache: NpmCache | null,
  lockfileHash: string,
): Promise<AuditResult | null> {
  // Try cache first
  if (cache && lockfileHash) {
    const cached = cache.getAudit(lockfileHash);
    if (cached) return cached;
  }

  try {
    // Use execFile to avoid shell injection
    const { stdout } = await execFileAsync("npm", ["audit", "--json"], {
      cwd: projectPath,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large audit output
    });
    const result = parseAuditOutput(stdout);

    // Cache the result
    if (result && cache && lockfileHash) {
      cache.setAudit(result, lockfileHash);
    }

    return result;
  } catch (error) {
    // npm audit exits with non-zero when vulnerabilities found
    if (error && typeof error === "object" && "stdout" in error) {
      const result = parseAuditOutput(error.stdout as string);
      if (result && cache && lockfileHash) {
        cache.setAudit(result, lockfileHash);
      }
      return result;
    }
    return null;
  }
}

interface NpmAuditData {
  metadata?: {
    vulnerabilities?: {
      critical?: number;
      high?: number;
      moderate?: number;
      low?: number;
      total?: number;
    };
  };
}

function parseAuditOutput(output: string): AuditResult | null {
  try {
    const data = JSON.parse(output) as NpmAuditData;

    // npm audit format
    if (data.metadata?.vulnerabilities) {
      const v = data.metadata.vulnerabilities;
      const critical = v.critical ?? 0;
      const high = v.high ?? 0;
      const moderate = v.moderate ?? 0;
      const low = v.low ?? 0;
      return {
        critical,
        high,
        moderate,
        low,
        total: v.total ?? critical + high + moderate + low,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function printDepsReport(result: DepsCheckResult): void {
  const { outdated, upToDate, failed, audit } = result;

  console.log();

  // Outdated packages
  if (outdated.length === 0) {
    console.log("  \x1b[32m✓ All dependencies are up to date\x1b[0m");
  } else {
    console.log(
      `  Found \x1b[1m${outdated.length}\x1b[0m outdated package${outdated.length > 1 ? "s" : ""}`,
    );
    console.log();

    // Group by update type
    const major = outdated.filter((d) => d.updateType === "major");
    const minor = outdated.filter((d) => d.updateType === "minor");
    const patch = outdated.filter((d) => d.updateType === "patch");
    const other = outdated.filter(
      (d) => d.updateType === "unknown" || d.updateType === "prerelease",
    );

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
  }

  // Security audit
  console.log("  \x1b[90m─────────────────────────────────────────\x1b[0m");
  console.log();
  console.log("  \x1b[1mSecurity Audit\x1b[0m");
  console.log();

  if (!audit) {
    console.log("    \x1b[90mCould not run npm audit\x1b[0m");
  } else if (audit.total === 0) {
    console.log("    \x1b[32m✓ No vulnerabilities found\x1b[0m");
  } else {
    if (audit.critical > 0) {
      console.log(`    \x1b[31m${audit.critical} critical\x1b[0m`);
    }
    if (audit.high > 0) {
      console.log(`    \x1b[31m${audit.high} high\x1b[0m`);
    }
    if (audit.moderate > 0) {
      console.log(`    \x1b[33m${audit.moderate} moderate\x1b[0m`);
    }
    if (audit.low > 0) {
      console.log(`    \x1b[90m${audit.low} low\x1b[0m`);
    }
  }

  // Summary
  console.log();
  console.log("  \x1b[90m─────────────────────────────────────────\x1b[0m");
  console.log();
  console.log("  \x1b[1mSummary\x1b[0m");
  console.log(`    ${outdated.length} outdated`);
  console.log(`    ${upToDate} up to date`);
  if (failed.length > 0) {
    console.log(`    ${failed.length} failed to check`);
  }
  if (audit) {
    console.log(`    ${audit.total} vulnerabilit${audit.total === 1 ? "y" : "ies"}`);
  }
  console.log();
}

export async function runDepsChecker(options: DepsCheckerOptions): Promise<void> {
  console.log();
  console.log("  \x1b[90mChecking dependencies...\x1b[0m");

  const result = await checkDeps(options);
  printDepsReport(result);
}
