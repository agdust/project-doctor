import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { ParsedConfig, RuleValue } from "../types.js";
import { safeJsonParse } from "../../utils/safe-json.js";

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

export async function readExistingConfig(projectPath: string): Promise<ParsedConfig | null> {
  const filePath = await findConfigFile(projectPath);
  if (!filePath) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return parseConfigContent(content, filePath);
  } catch {
    // File can't be read
    return null;
  }
}

// Maximum number of rules to parse (prevents DoS on malformed files)
const MAX_RULES = 10000;
// Maximum line length to process (prevents ReDoS on very long lines)
const MAX_LINE_LENGTH = 1000;
// Maximum content size to process (10MB)
const MAX_CONTENT_SIZE = 10 * 1024 * 1024;

function parseConfigContent(content: string, filePath: string): ParsedConfig {
  const rules: Record<string, RuleValue> = {};

  // Guard against excessively large files
  if (content.length > MAX_CONTENT_SIZE) {
    return { rules: {}, hasTypeChecking: false, filePath };
  }

  // Process line by line to prevent ReDoS on long content
  // This is safer than running a global regex on the entire file
  const lines = content.split("\n");
  let ruleCount = 0;

  // Match rule definitions using regex
  // Handles: "rule-name": "error", "rule-name": ["error", options]
  const rulePattern = /["']([^"']+)["']\s*:\s*(\[[^\]]*\]|"[^"]*"|'[^']*')/;

  for (const line of lines) {
    // Skip very long lines to prevent ReDoS
    if (line.length > MAX_LINE_LENGTH) continue;

    // Stop if we've found too many rules
    if (ruleCount >= MAX_RULES) break;

    const match = rulePattern.exec(line);
    if (!match) continue;

    const [, name, valueStr] = match;

    // Skip if not a rule name pattern (contains / for plugin rules or is bare word)
    if (!isRuleName(name)) continue;

    ruleCount++;

    // Normalize quotes for JSON parsing
    const normalized = valueStr.replace(/'/g, '"');
    const value = safeJsonParse<RuleValue>(normalized);
    if (value !== null) {
      rules[name] = value;
      continue;
    }

    // Try parsing as simple string
    const stripped = valueStr.replace(/['"]/g, "");
    if (stripped === "error" || stripped === "warn" || stripped === "off") {
      rules[name] = stripped;
    }
  }

  // Detect type-checking usage
  const hasTypeChecking =
    content.includes("projectService") ||
    content.includes("project:") ||
    content.includes("recommendedTypeChecked") ||
    content.includes("strictTypeChecked");

  return {
    rules,
    hasTypeChecking,
    filePath,
  };
}

function isRuleName(name: string): boolean {
  // ESLint rules are either plain (no-unused-vars) or scoped (@typescript-eslint/...)
  if (name.startsWith("@")) {
    // Scoped plugin rule
    return name.includes("/") && !name.startsWith("@/");
  }
  // Core rule - contains only lowercase, numbers, hyphens
  return /^[a-z][a-z0-9-]*$/.test(name);
}
