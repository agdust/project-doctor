/**
 * CLI Utilities
 */

import path from "node:path";

/** Parse path from args, defaulting to cwd */
// AGENT: unifyu usage of project path, we should probably keep it in one variable to avoid confusion and reimplementing same detection
export function getProjectPath(args: string[]): string {
  const pathArg = args.find((a) => !a.startsWith("-"));
  return path.resolve(pathArg ?? process.cwd());
}

/** Check if first non-flag arg looks like a path */
export function isPath(arg: string | undefined): boolean {
  return (
    arg !== undefined &&
    !arg.startsWith("-") &&
    (arg.startsWith("/") ||
      arg.startsWith("./") ||
      arg.startsWith("..") ||
      arg.includes("/") ||
      arg === ".")
  );
}
