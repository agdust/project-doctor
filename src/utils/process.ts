import { spawn } from "node:child_process";

export type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<CommandResult> {
  // TODO: Implement
  // - Spawn process with given command and args
  // - Capture stdout and stderr
  // - Return exit code
  throw new Error("Not implemented");
}

export async function commandExists(command: string): Promise<boolean> {
  // TODO: Implement
  // - Try to run `which` or `where` depending on platform
  // - Return true if command found
  throw new Error("Not implemented");
}

export async function runNpmScript(
  script: string,
  cwd: string
): Promise<CommandResult> {
  // TODO: Implement
  // - Detect package manager (npm, yarn, pnpm)
  // - Run appropriate command
  throw new Error("Not implemented");
}

export function detectPackageManager(
  projectPath: string
): Promise<"npm" | "yarn" | "pnpm" | null> {
  // TODO: Implement
  // - Check for lockfiles to detect package manager
  throw new Error("Not implemented");
}
