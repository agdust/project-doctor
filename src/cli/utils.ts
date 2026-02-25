/**
 * CLI Utilities
 */

import path from "node:path";

/** Parse path from args, defaulting to cwd */
export function getProjectPath(args: string[]): string {
  const pathArg = args.find((a) => !a.startsWith("-"));
  return path.resolve(pathArg ?? process.cwd());
}

/** Check if first non-flag arg looks like a path */
export function isPath(arg: string | undefined): boolean {
  return (
    !!arg &&
    !arg.startsWith("-") &&
    (arg.startsWith("/") ||
      arg.startsWith("./") ||
      arg.startsWith("..") ||
      arg.includes("/") ||
      arg === ".")
  );
}
