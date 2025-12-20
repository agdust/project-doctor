import type { Check, CheckResult } from "../types.ts";

export type RunnerOptions = {
  projectPath: string;
  parallel: boolean;
  stopOnFail: boolean;
  filter?: string[];
  exclude?: string[];
};

export async function runChecks(
  checks: Check[],
  options: RunnerOptions
): Promise<CheckResult[]> {
  // TODO: Implement
  // - Filter checks based on filter/exclude patterns
  // - Run checks in parallel or sequentially based on options
  // - Handle errors and convert to CheckResult
  // - Stop early if stopOnFail is true and a check fails
  throw new Error("Not implemented");
}

export async function runCheck(
  check: Check,
  projectPath: string
): Promise<CheckResult> {
  // TODO: Implement
  // - Run single check with error handling
  // - Catch errors and return as failed result
  // - Add timing information
  throw new Error("Not implemented");
}

export function filterChecks(
  checks: Check[],
  include?: string[],
  exclude?: string[]
): Check[] {
  // TODO: Implement
  // - Filter checks by name patterns
  throw new Error("Not implemented");
}
