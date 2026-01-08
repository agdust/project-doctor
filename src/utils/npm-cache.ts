import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { AuditResult } from "./deps-checker.js";

const CACHE_DIR = ".project-doctor/cache";
const CACHE_FILE = "npm-cache.json";
const TTL_MS = 60 * 60 * 1000; // 1 hour

type VersionCacheEntry = {
  version: string;
  cachedAt: number;
};

type AuditCacheEntry = {
  result: AuditResult;
  lockfileHash: string;
  cachedAt: number;
};

type NpmCacheData = {
  versions: Record<string, VersionCacheEntry>;
  audit: AuditCacheEntry | null;
};

export type NpmCache = {
  getVersion(packageName: string): string | null;
  setVersion(packageName: string, version: string): void;
  getAudit(lockfileHash: string): AuditResult | null;
  setAudit(result: AuditResult, lockfileHash: string): void;
  flush(): Promise<void>;
};

function isExpired(cachedAt: number): boolean {
  return Date.now() - cachedAt > TTL_MS;
}

async function loadCacheData(cachePath: string): Promise<NpmCacheData> {
  try {
    const content = await readFile(cachePath, "utf-8");
    const data = JSON.parse(content) as NpmCacheData;
    // Validate structure
    if (typeof data.versions !== "object" || data.versions === null) {
      return { versions: {}, audit: null };
    }
    return data;
  } catch {
    return { versions: {}, audit: null };
  }
}

async function saveCacheData(cacheDir: string, cachePath: string, data: NpmCacheData): Promise<void> {
  try {
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cachePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Silently fail - caching is best-effort
  }
}

export async function computeLockfileHash(projectPath: string): Promise<string> {
  const lockfiles = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

  for (const lockfile of lockfiles) {
    try {
      const content = await readFile(join(projectPath, lockfile), "utf-8");
      return createHash("sha256").update(content).digest("hex").slice(0, 16);
    } catch {
      // Try next lockfile
    }
  }

  return "";
}

export async function createNpmCache(projectPath: string): Promise<NpmCache> {
  const cacheDir = join(projectPath, CACHE_DIR);
  const cachePath = join(cacheDir, CACHE_FILE);

  const data = await loadCacheData(cachePath);
  let dirty = false;

  return {
    getVersion(packageName: string): string | null {
      const entry = data.versions[packageName];
      if (!entry) return null;
      if (isExpired(entry.cachedAt)) {
        delete data.versions[packageName];
        dirty = true;
        return null;
      }
      return entry.version;
    },

    setVersion(packageName: string, version: string): void {
      data.versions[packageName] = {
        version,
        cachedAt: Date.now(),
      };
      dirty = true;
    },

    getAudit(lockfileHash: string): AuditResult | null {
      if (!data.audit) return null;
      if (!lockfileHash || data.audit.lockfileHash !== lockfileHash) return null;
      if (isExpired(data.audit.cachedAt)) {
        data.audit = null;
        dirty = true;
        return null;
      }
      return data.audit.result;
    },

    setAudit(result: AuditResult, lockfileHash: string): void {
      if (!lockfileHash) return;
      data.audit = {
        result,
        lockfileHash,
        cachedAt: Date.now(),
      };
      dirty = true;
    },

    async flush(): Promise<void> {
      if (dirty) {
        await saveCacheData(cacheDir, cachePath, data);
        dirty = false;
      }
    },
  };
}
