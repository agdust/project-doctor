import { access } from "node:fs/promises";
import { join } from "node:path";
import type { ParsedConfig } from "../types.js";

const CONFIG_FILES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
] as const;

export async function findConfigFile(projectPath: string): Promise<string | null> {
  for (const file of CONFIG_FILES) {
    const filePath = join(projectPath, file);
    try {
      await access(filePath);
      return filePath;
    } catch {
      // File doesn't exist, try next
      continue;
    }
  }
  return null;
}

/**
 * Read and parse an existing ESLint flat config file.
 *
 * TODO: Implement proper parsing using a JS/TS AST parser.
 * Requirements:
 * - Parse ESLint flat config files (eslint.config.js/mjs/cjs/ts/mts)
 * - Extract rule configurations from the config array
 * - Handle various config patterns (objects, spreads, function calls)
 * - Detect type-checking usage (projectService, recommendedTypeChecked, etc.)
 *
 * Suggested approach:
 * - Use @babel/parser or TypeScript compiler API to parse the file
 * - Walk the AST to find rule definitions
 * - Handle edge cases like dynamic configs, imports, etc.
 *
 * @throws {Error} NotImplemented - Parsing not yet implemented
 */
export async function readExistingConfig(projectPath: string): Promise<ParsedConfig | null> {
  const filePath = await findConfigFile(projectPath);
  if (!filePath) {
    return null;
  }

  // TODO: Implement proper ESLint config parsing
  // The previous regex-based implementation was fragile and couldn't handle:
  // - Nested arrays/objects in rule options
  // - Multi-line rule definitions
  // - Dynamic configurations
  // - Imported/spread configurations
  throw new Error("NotImplemented: ESLint config parsing requires a proper JS/TS parser");
}
