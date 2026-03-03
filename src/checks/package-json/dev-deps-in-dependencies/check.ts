import { TAG, type Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, skip } from "../../helpers.js";
import { extractCheckOptions } from "../../../config/severity.js";
import { bold } from "../../../utils/colors.js";

const name = "package-json-dev-deps-in-dependencies";

interface DevOnlyPackage {
  reason: string;
}

/** Packages that should almost always be in devDependencies */
const DEV_ONLY_PACKAGES: Record<string, DevOnlyPackage> = {
  eslint: { reason: "Linter — only needed during development" },
  "@stylistic/eslint-plugin": { reason: "ESlint plugin — only needed during development" },
  prettier: { reason: "Code formatter — only needed during development" },
  typescript: { reason: "TypeScript compiler — only needed during build" },
  "ts-node": { reason: "TypeScript runner — only needed during development" },
  tsx: { reason: "TypeScript runner — only needed during development" },
  jest: { reason: "Test framework — only needed during testing" },
  vitest: { reason: "Test framework — only needed during testing" },
  mocha: { reason: "Test framework — only needed during testing" },
  chai: { reason: "Test assertion library — only needed during testing" },
  sinon: { reason: "Test mocking library — only needed during testing" },
  c8: { reason: "Code coverage tool — only needed during testing" },
  nyc: { reason: "Code coverage tool — only needed during testing" },
  webpack: { reason: "Bundler — only needed during build" },
  rollup: { reason: "Bundler — only needed during build" },
  esbuild: { reason: "Bundler — only needed during build" },
  vite: { reason: "Build tool — only needed during development/build" },
  parcel: { reason: "Bundler — only needed during build" },
  turbo: { reason: "Build orchestrator — only needed during development" },
  husky: { reason: "Git hooks manager — only needed during development" },
  "lint-staged": { reason: "Pre-commit linting — only needed during development" },
  commitlint: { reason: "Commit message linter — only needed during development" },
  nodemon: { reason: "File watcher — only needed during development" },
  concurrently: { reason: "Script runner — only needed during development" },
  "npm-run-all": { reason: "Script runner — only needed during development" },
  "npm-run-all2": { reason: "Script runner — only needed during development" },
  rimraf: { reason: "Clean utility — only needed during build scripts" },
  "size-limit": { reason: "Bundle size checker — only needed during CI/development" },
  knip: { reason: "Dead code finder — only needed during development" },
};

interface PrefixPattern {
  prefix: string;
  reason: string;
}

/** Package name prefixes that indicate dev-only packages */
const DEV_ONLY_PREFIXES: PrefixPattern[] = [
  { prefix: "@types/", reason: "Type definitions — only needed during build" },
  { prefix: "eslint-plugin-", reason: "ESLint plugin — only needed during development" },
  { prefix: "eslint-config-", reason: "ESLint config — only needed during development" },
  { prefix: "@eslint/", reason: "ESLint package — only needed during development" },
  { prefix: "@typescript-eslint/", reason: "TypeScript ESLint — only needed during development" },
];

interface Misplaced {
  name: string;
  reason: string;
}

function findMisplacedDeps(deps: string[], exceptions: Set<string>): Misplaced[] {
  const misplaced: Misplaced[] = [];

  for (const dep of deps) {
    if (exceptions.has(dep)) {
      continue;
    }

    // Check exact matches
    const exactMatch = DEV_ONLY_PACKAGES[dep];
    if (exactMatch !== undefined) {
      misplaced.push({ name: dep, reason: exactMatch.reason });
      continue;
    }

    // Check prefix patterns
    for (const { prefix, reason } of DEV_ONLY_PREFIXES) {
      if (dep.startsWith(prefix)) {
        misplaced.push({ name: dep, reason });
        break;
      }
    }
  }

  return misplaced;
}

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check for dev-only packages in dependencies instead of devDependencies",
  tags: [TAG.node, TAG.recommended, TAG.effort.low],
  run: (global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No package.json");
    }

    const deps = Object.keys(parsed.dependencies ?? {});
    if (deps.length === 0) {
      return pass(name, "No dependencies");
    }

    // Read per-check exceptions from config
    const options = extractCheckOptions(global.config.checks[name]);
    const exceptions = new Set<string>(
      Array.isArray(options?.exceptions) ? (options.exceptions as string[]) : [],
    );

    const misplaced = findMisplacedDeps(deps, exceptions);

    if (misplaced.length === 0) {
      return pass(name, "No dev-only packages in dependencies");
    }

    const lines = [
      `${misplaced.length} dev-only package(s) found in dependencies:`,
      "",
      ...misplaced.map((m) => `  - ${bold(m.name)}: ${m.reason}`),
    ];

    return {
      name,
      status: "fail",
      message: lines.join("\n"),
    };
  },
};
