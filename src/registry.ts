import type { Check, CheckGroup, GlobalContext, GroupContextLoader } from "./types.js";

import { loadContext as loadPackageJsonContext } from "./checks/package-json/context.js";
import { checks as packageJsonChecks } from "./checks/package-json/checks.js";

import { loadContext as loadTsconfigContext } from "./checks/tsconfig/context.js";
import { checks as tsconfigChecks } from "./checks/tsconfig/checks.js";

import { loadContext as loadGitignoreContext } from "./checks/gitignore/context.js";
import { checks as gitignoreChecks } from "./checks/gitignore/checks.js";

import { loadContext as loadGitContext } from "./checks/git/context.js";
import { checks as gitChecks } from "./checks/git/checks.js";

import { loadContext as loadEslintContext } from "./checks/eslint/context.js";
import { checks as eslintChecks } from "./checks/eslint/checks.js";

import { loadContext as loadPrettierContext } from "./checks/prettier/context.js";
import { checks as prettierChecks } from "./checks/prettier/checks.js";

import { loadContext as loadEditorconfigContext } from "./checks/editorconfig/context.js";
import { checks as editorconfigChecks } from "./checks/editorconfig/checks.js";

import { loadContext as loadNvmrcContext } from "./checks/nvmrc/context.js";
import { checks as nvmrcChecks } from "./checks/nvmrc/checks.js";

import { loadContext as loadDocsContext } from "./checks/docs/context.js";
import { checks as docsChecks } from "./checks/docs/checks.js";

import { loadContext as loadDepsContext } from "./checks/deps/context.js";
import { checks as depsChecks } from "./checks/deps/checks.js";

import { loadContext as loadEnvContext } from "./checks/env/context.js";
import { checks as envChecks } from "./checks/env/checks.js";

import { loadContext as loadTestingContext } from "./checks/testing/context.js";
import { checks as testingChecks } from "./checks/testing/checks.js";

import { loadContext as loadFrameworkContext } from "./checks/framework/context.js";
import { checks as frameworkChecks } from "./checks/framework/checks.js";

function createGroup<T>(
  name: string,
  loadContext: GroupContextLoader<T>,
  checks: Check<T>[]
): CheckGroup<T> {
  return { name, loadContext, checks };
}

export const checkGroups = [
  createGroup("package-json", loadPackageJsonContext, packageJsonChecks),
  createGroup("tsconfig", loadTsconfigContext, tsconfigChecks),
  createGroup("gitignore", loadGitignoreContext, gitignoreChecks),
  createGroup("git", loadGitContext, gitChecks),
  createGroup("eslint", loadEslintContext, eslintChecks),
  createGroup("prettier", loadPrettierContext, prettierChecks),
  createGroup("editorconfig", loadEditorconfigContext, editorconfigChecks),
  createGroup("nvmrc", loadNvmrcContext, nvmrcChecks),
  createGroup("docs", loadDocsContext, docsChecks),
  createGroup("deps", loadDepsContext, depsChecks),
  createGroup("env", loadEnvContext, envChecks),
  createGroup("testing", loadTestingContext, testingChecks),
  createGroup("framework", loadFrameworkContext, frameworkChecks),
];

export function getAllChecks(): Check<unknown>[] {
  return checkGroups.flatMap((group) => group.checks as Check<unknown>[]);
}

export function getChecksByGroup(groupName: string): Check<unknown>[] {
  const group = checkGroups.find((g) => g.name === groupName);
  return (group?.checks as Check<unknown>[]) ?? [];
}

export function listGroups(): string[] {
  return checkGroups.map((g) => g.name);
}

export function listChecks(): { group: string; name: string; description: string; tags: string[] }[] {
  return checkGroups.flatMap((group) =>
    group.checks.map((check) => ({
      group: group.name,
      name: check.name,
      description: check.description,
      tags: check.tags,
    }))
  );
}

export async function runGroupChecks<T>(
  group: CheckGroup<T>,
  global: GlobalContext
): Promise<{ name: string; results: Awaited<ReturnType<Check<T>["run"]>>[] }> {
  const groupContext = await group.loadContext(global);
  const results = await Promise.all(
    group.checks.map((check) => check.run(global, groupContext))
  );
  return { name: group.name, results };
}
