import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { FileCache } from "../types.ts";

export function createFileCache(projectPath: string): FileCache {
  const textCache = new Map<string, string | null>();
  const jsonCache = new Map<string, unknown>();
  const existsCache = new Map<string, boolean>();

  return {
    async readText(relativePath: string): Promise<string | null> {
      if (textCache.has(relativePath)) {
        return textCache.get(relativePath) ?? null;
      }

      const fullPath = join(projectPath, relativePath);
      try {
        const content = await readFile(fullPath, "utf-8");
        textCache.set(relativePath, content);
        return content;
      } catch {
        textCache.set(relativePath, null);
        return null;
      }
    },

    async readJson<T>(relativePath: string): Promise<T | null> {
      const cacheKey = relativePath;
      if (jsonCache.has(cacheKey)) {
        return jsonCache.get(cacheKey) as T | null;
      }

      const text = await this.readText(relativePath);
      if (!text) {
        jsonCache.set(cacheKey, null);
        return null;
      }

      try {
        const parsed = JSON.parse(text) as T;
        jsonCache.set(cacheKey, parsed);
        return parsed;
      } catch {
        jsonCache.set(cacheKey, null);
        return null;
      }
    },

    async exists(relativePath: string): Promise<boolean> {
      if (existsCache.has(relativePath)) {
        return existsCache.get(relativePath) ?? false;
      }

      const fullPath = join(projectPath, relativePath);
      try {
        await stat(fullPath);
        existsCache.set(relativePath, true);
        return true;
      } catch {
        existsCache.set(relativePath, false);
        return false;
      }
    },
  };
}
