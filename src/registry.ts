import type { Check, CheckGroup, GlobalContext, GroupContextLoader } from "./types.js";

import { loadContext as loadPackageJsonContext, checks as packageJsonChecks } from "./checks/package-json/index.js";
import { loadContext as loadTsconfigContext, checks as tsconfigChecks } from "./checks/tsconfig/index.js";
import { loadContext as loadGitignoreContext, checks as gitignoreChecks } from "./checks/gitignore/index.js";
import { loadContext as loadGitContext, checks as gitChecks } from "./checks/git/index.js";
import { loadContext as loadEslintContext, checks as eslintChecks } from "./checks/eslint/index.js";
import { loadContext as loadPrettierContext, checks as prettierChecks } from "./checks/prettier/index.js";
import { loadContext as loadJscpdContext, checks as jscpdChecks } from "./checks/jscpd/index.js";
import { loadContext as loadEditorconfigContext, checks as editorconfigChecks } from "./checks/editorconfig/index.js";
import { loadContext as loadNpmContext, checks as npmChecks } from "./checks/npm/index.js";
import { loadContext as loadDocsContext, checks as docsChecks } from "./checks/docs/index.js";
import { loadContext as loadDepsContext, checks as depsChecks } from "./checks/deps/index.js";
import { loadContext as loadEnvContext, checks as envChecks } from "./checks/env/index.js";
import { loadContext as loadTestingContext, checks as testingChecks } from "./checks/testing/index.js";
import { loadContext as loadBundleSizeContext, checks as bundleSizeChecks } from "./checks/bundle-size/index.js";
import { loadContext as loadDockerContext, checks as dockerChecks } from "./checks/docker/index.js";
import { loadContext as loadNpmSecurityContext, checks as npmSecurityChecks } from "./checks/npm-security/index.js";

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
  createGroup("jscpd", loadJscpdContext, jscpdChecks),
  createGroup("editorconfig", loadEditorconfigContext, editorconfigChecks),
  createGroup("npm", loadNpmContext, npmChecks),
  createGroup("docs", loadDocsContext, docsChecks),
  createGroup("deps", loadDepsContext, depsChecks),
  createGroup("env", loadEnvContext, envChecks),
  createGroup("testing", loadTestingContext, testingChecks),
  createGroup("bundle-size", loadBundleSizeContext, bundleSizeChecks),
  createGroup("docker", loadDockerContext, dockerChecks),
  createGroup("npm-security", loadNpmSecurityContext, npmSecurityChecks),
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
