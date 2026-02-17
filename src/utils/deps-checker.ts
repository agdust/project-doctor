import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import semver from "semver";
import { createNpmCache, computeLockfileHash, type NpmCache } from "./npm-cache.js";
import { safeJsonParse } from "./safe-json.js";
import { bold, dim, green, yellow, red } from "./colors.js";

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

/**
 * Determine the type of update between two versions using semver.
 */
function getUpdateType(current: string, latest: string): VersionInfo["updateType"] {
  const currentClean = semver.coerce(current);
  const latestClean = semver.coerce(latest);

  if (!currentClean || !latestClean) return "unknown";

  // Check for prerelease
  const latestParsed = semver.parse(latest);
  if (latestParsed?.prerelease && latestParsed.prerelease.length > 0) {
    return "prerelease";
  }

  const diff = semver.diff(currentClean, latestClean);

  switch (diff) {
    case "major":
    case "premajor":
      return "major";
    case "minor":
    case "preminor":
      return "minor";
    case "patch":
    case "prepatch":
      return "patch";
    case "prerelease":
      return "prerelease";
    default:
      return "unknown";
  }
}

/**
 * Check if latest version is greater than current version using semver.
 */
function isOutdated(current: string, latest: string): boolean {
  const currentClean = semver.coerce(current);
  const latestClean = semver.coerce(latest);

  if (!currentClean || !latestClean) return false;

  return semver.gt(latestClean, currentClean);
}

/**
 * Validate npm package name format.
 * Based on npm naming rules: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name
 */
function isValidPackageName(name: string): boolean {
  // Must be non-empty and max 214 characters
  if (!name || name.length > 214) return false;

  // Scoped packages: @scope/name
  if (name.startsWith("@")) {
    const parts = name.slice(1).split("/");
    if (parts.length !== 2) return false;
    const [scope, pkg] = parts;
    return isValidNamePart(scope) && isValidNamePart(pkg);
  }

  return isValidNamePart(name);
}

function isValidNamePart(name: string): boolean {
  // Must start with lowercase letter or digit, contain only safe URL characters
  // Allowed: lowercase letters, digits, hyphens, underscores, dots
  return /^[a-z0-9][a-z0-9._-]*$/.test(name);
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLatestVersion(
  packageName: string,
  cache: NpmCache | null,
): Promise<string | null> {
  // Validate package name to prevent URL injection
  if (!isValidPackageName(packageName)) {
    return null;
  }

  // Try cache first
  if (cache) {
    const cached = cache.getVersion(packageName);
    if (cached) return cached;
  }

  try {
    // URL-encode the package name (handles scoped packages like @scope/name)
    const encodedName = encodeURIComponent(packageName).replace("%40", "@").replace("%2F", "/");
    const response = await fetch(`https://registry.npmjs.org/${encodedName}/latest`);
    if (!response.ok) {
      // Package might not exist or be private
      return null;
    }
    const data = (await response.json()) as { version?: string };
    const version = typeof data.version === "string" ? data.version : null;

    // Cache the result
    if (version && cache) {
      cache.setVersion(packageName, version);
    }

    return version;
  } catch (error) {
    // Log network errors in debug mode (when DEBUG env is set)
    if (process.env.DEBUG) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[DEBUG] Failed to fetch ${packageName}: ${errorMessage}`);
    }
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
    const parsed = safeJsonParse<PackageJson>(content);
    if (!parsed) {
      throw new Error("Invalid package.json");
    }
    pkg = parsed;
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
  const batchDelayMs = 100; // Rate limit: 100ms between batches

  for (let i = 0; i < deps.length; i += batchSize) {
    // Add delay between batches (but not before the first batch)
    if (i > 0) {
      await delay(batchDelayMs);
    }

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

      // Check if it's actually outdated using semver
      if (!isOutdated(dep.version, latest)) {
        upToDate++;
        continue;
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
    const data = safeJsonParse<NpmAuditData>(output);
    if (!data) return null;

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
    // JSON parsing failed
    return null;
  }
}

export function printDepsReport(result: DepsCheckResult): void {
  const { outdated, upToDate, failed, audit } = result;

  console.log();

  // Outdated packages
  if (outdated.length === 0) {
    console.log(`  ${green("✓ All dependencies are up to date")}`);
  } else {
    console.log(`  Found ${bold(String(outdated.length))} outdated package${outdated.length > 1 ? "s" : ""}`);
    console.log();

    // Group by update type
    const major = outdated.filter((d) => d.updateType === "major");
    const minor = outdated.filter((d) => d.updateType === "minor");
    const patch = outdated.filter((d) => d.updateType === "patch");
    const other = outdated.filter(
      (d) => d.updateType === "unknown" || d.updateType === "prerelease",
    );

    const printSection = (items: VersionInfo[], label: string, colorFn: (s: string) => string) => {
      if (items.length === 0) return;
      console.log(`  ${colorFn(label)}`);
      for (const dep of items) {
        const devLabel = dep.type === "devDependencies" ? ` ${dim("(dev)")}` : "";
        console.log(`    ${dep.name}${devLabel}`);
        console.log(`      ${dim(dep.current)} → ${green(dep.latest)}`);
      }
      console.log();
    };

    printSection(major, "Major updates (breaking changes possible)", red);
    printSection(minor, "Minor updates (new features)", yellow);
    printSection(patch, "Patch updates (bug fixes)", green);
    printSection(other, "Other updates", dim);
  }

  // Security audit
  console.log(`  ${dim("─────────────────────────────────────────")}`);
  console.log();
  console.log(`  ${bold("Security Audit")}`);
  console.log();

  if (!audit) {
    console.log(`    ${dim("Could not run npm audit")}`);
  } else if (audit.total === 0) {
    console.log(`    ${green("✓ No vulnerabilities found")}`);
  } else {
    if (audit.critical > 0) {
      console.log(`    ${red(`${audit.critical} critical`)}`);
    }
    if (audit.high > 0) {
      console.log(`    ${red(`${audit.high} high`)}`);
    }
    if (audit.moderate > 0) {
      console.log(`    ${yellow(`${audit.moderate} moderate`)}`);
    }
    if (audit.low > 0) {
      console.log(`    ${dim(`${audit.low} low`)}`);
    }
  }

  // Summary
  console.log();
  console.log(`  ${dim("─────────────────────────────────────────")}`);
  console.log();
  console.log(`  ${bold("Summary")}`);
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
  console.log(`  ${dim("Checking dependencies...")}`);

  const result = await checkDeps(options);
  printDepsReport(result);
}
