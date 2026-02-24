import type { ResolvedConfig } from "./config/types.js";

export type CheckStatus = "pass" | "fail" | "skip";

export interface CheckResultBase {
  name: string;
  status: CheckStatus;
  message: string;
  details?: string[];
}

export interface FixResult {
  success: boolean;
  message: string;
}

export interface FixOption<GroupCtx = unknown> {
  id: string;
  label: string;
  description?: string;
  run: (global: GlobalContext, group: GroupCtx) => Promise<FixResult>;
}

export type CheckResult = CheckResultBase & {
  group: string;
};

export type CheckScope = "universal" | "node" | "typescript";

export type CheckRequirement = "required" | "recommended" | "opinionated";

export type CheckTool = `tool:${string}`;

export type CheckEffort = "effort:low" | "effort:medium" | "effort:high";

export type CheckSource = `source:${string}`;

export type CheckCategory = "security";

export type CheckTag =
  | CheckScope
  | CheckRequirement
  | CheckTool
  | CheckEffort
  | CheckSource
  | CheckCategory;

export interface FileCache {
  readText(relativePath: string): Promise<string | null>;
  readJson<T>(relativePath: string): Promise<T | null>;
  exists(relativePath: string): Promise<boolean>;
}

export interface DetectedTools {
  packageManager: "npm" | "yarn" | "pnpm" | null;
  hasTypeScript: boolean;
  hasEslint: boolean;
  hasPrettier: boolean;
  hasDocker: boolean;
  hasKnip: boolean;
  hasSizeLimit: boolean;
  hasJscpd: boolean;
  isMonorepo: boolean;
}

export interface GlobalContext {
  projectPath: string;
  detected: DetectedTools;
  files: FileCache;
  config: ResolvedConfig;
}

export interface SimpleFix<GroupCtx = unknown> {
  description: string;
  run: (global: GlobalContext, group: GroupCtx) => Promise<FixResult>;
}

export interface FixWithOptions<GroupCtx = unknown> {
  description: string;
  options: FixOption<GroupCtx>[];
}

export type Fix<GroupCtx = unknown> = SimpleFix<GroupCtx> | FixWithOptions<GroupCtx>;

export interface Check<GroupCtx = unknown> {
  name: string;
  description: string;
  tags: CheckTag[];
  run: (global: GlobalContext, group: GroupCtx) => Promise<CheckResultBase>;
  fix?: Fix<GroupCtx>;
}

export type GroupContextLoader<T> = (global: GlobalContext) => Promise<T>;

export interface CheckGroup<GroupCtx = unknown> {
  name: string;
  loadContext: GroupContextLoader<GroupCtx>;
  checks: Check<GroupCtx>[];
}

// ============================================================================
// Manual Checks - require human verification, no auto-detection
// ============================================================================

export type ManualCheckState = "done" | "not-done";

export interface ManualCheck {
  name: string;
  description: string;
  details: string;
  tags: CheckTag[];
  why?: string;
}
