import { check as repoExists } from "./repo-exists/check.js";
import { check as hooksInstalled } from "./hooks-installed/check.js";
import { check as conventionalCommits } from "./conventional-commits/check.js";

export { loadContext } from "./context.js";

export const checks = [repoExists, hooksInstalled, conventionalCommits];
