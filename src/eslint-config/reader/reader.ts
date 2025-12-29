import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { ParsedConfig, RuleValue } from "../types.js";

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
    return null;
  }
}

function parseConfigContent(content: string, filePath: string): ParsedConfig {
  const rules: Record<string, RuleValue> = {};

  // Match rule definitions using regex
  // Handles: "rule-name": "error", "rule-name": ["error", options]
  const rulePattern = /["']([^"']+)["']\s*:\s*(\[[^\]]*\]|"[^"]*"|'[^']*')/g;

  let match;
  while ((match = rulePattern.exec(content)) !== null) {
    const [, name, valueStr] = match;

    // Skip if not a rule name pattern (contains / for plugin rules or is bare word)
    if (!isRuleName(name)) continue;

    try {
      // Normalize quotes for JSON parsing
      const normalized = valueStr.replace(/'/g, '"');
      const value = JSON.parse(normalized) as RuleValue;
      rules[name] = value;
    } catch {
      // Try parsing as simple string
      const stripped = valueStr.replace(/['"]/g, "");
      if (stripped === "error" || stripped === "warn" || stripped === "off") {
        rules[name] = stripped;
      }
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
