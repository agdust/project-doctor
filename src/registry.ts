import type { Check, CheckCategory } from "./types.ts";

import { checks as nvmrcChecks } from "./checks/nvmrc.ts";
import { checks as gitignoreChecks } from "./checks/gitignore.ts";
import { checks as prettierChecks } from "./checks/prettier.ts";
import { checks as editorconfigChecks } from "./checks/editorconfig.ts";
import { checks as projectSizeChecks } from "./checks/project-size.ts";
import { checks as knipChecks } from "./checks/knip.ts";
import { checks as typescriptChecks } from "./checks/typescript.ts";
import { checks as eslintChecks } from "./checks/eslint.ts";
import { checks as packageJsonChecks } from "./checks/package-json.ts";
import { checks as gitChecks } from "./checks/git.ts";

type CheckGroup = {
  name: string;
  category: CheckCategory;
  checks: Check[];
};

export const checkGroups: CheckGroup[] = [
  { name: "git", category: "health", checks: gitChecks },
  { name: "gitignore", category: "health", checks: gitignoreChecks },
  { name: "nvmrc", category: "health", checks: nvmrcChecks },
  { name: "package-json", category: "health", checks: packageJsonChecks },
  { name: "typescript", category: "health", checks: typescriptChecks },
  { name: "eslint", category: "health", checks: eslintChecks },
  { name: "prettier", category: "health", checks: prettierChecks },
  { name: "editorconfig", category: "health", checks: editorconfigChecks },
  { name: "knip", category: "health", checks: knipChecks },
  { name: "project-size", category: "health", checks: projectSizeChecks },
];

export function getAllChecks(): Check[] {
  return checkGroups.flatMap((group) => group.checks);
}

export function getChecksByCategory(category: CheckCategory): Check[] {
  return checkGroups
    .filter((group) => group.category === category)
    .flatMap((group) => group.checks);
}

export function getChecksByGroup(groupName: string): Check[] {
  const group = checkGroups.find((g) => g.name === groupName);
  return group?.checks ?? [];
}

export function listGroups(): string[] {
  return checkGroups.map((g) => g.name);
}

export function listChecks(): { group: string; name: string; description: string }[] {
  return checkGroups.flatMap((group) =>
    group.checks.map((check) => ({
      group: group.name,
      name: check.name,
      description: check.description,
    }))
  );
}
