/**
 * Utilities for testing auto-fix functionality.
 *
 * Since fixes modify files, we copy fixtures to temporary directories
 * before running tests to avoid polluting the original fixtures.
 */

import { mkdtemp, rm, cp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fixtures, type FixtureName } from "./fixtures.js";

export type TempFixture = {
  path: string;
  cleanup: () => Promise<void>;
  readFile: (relativePath: string) => Promise<string>;
  writeFile: (relativePath: string, content: string) => Promise<void>;
  readJson: <T>(relativePath: string) => Promise<T>;
  writeJson: (relativePath: string, data: unknown) => Promise<void>;
};

function buildTempFixture(tempDir: string): TempFixture {
  return {
    path: tempDir,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
    readFile: async (relativePath: string) => {
      return readFile(path.join(tempDir, relativePath), "utf-8");
    },
    writeFile: async (relativePath: string, content: string) => {
      await writeFile(path.join(tempDir, relativePath), content, "utf-8");
    },
    readJson: async <T>(relativePath: string): Promise<T> => {
      const content = await readFile(path.join(tempDir, relativePath), "utf-8");
      return JSON.parse(content) as T;
    },
    writeJson: async (relativePath: string, data: unknown) => {
      await writeFile(
        path.join(tempDir, relativePath),
        JSON.stringify(data, null, 2) + "\n",
        "utf-8",
      );
    },
  };
}

/**
 * Copy a fixture to a temporary directory for safe testing.
 * Returns the temp path and a cleanup function.
 */
export async function copyFixtureToTemp(fixtureName: FixtureName): Promise<TempFixture> {
  const tempDir = await mkdtemp(path.join(tmpdir(), `fix-test-${fixtureName}-`));
  const sourcePath = fixtures[fixtureName];

  await cp(sourcePath, tempDir, { recursive: true });

  return buildTempFixture(tempDir);
}

/**
 * Create an empty temporary directory for testing.
 */
export async function createEmptyTempDir(prefix = "fix-test"): Promise<TempFixture> {
  const tempDir = await mkdtemp(path.join(tmpdir(), `${prefix}-`));

  return buildTempFixture(tempDir);
}
