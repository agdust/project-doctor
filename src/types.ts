import type { ResolvedConfig } from "./config/types.js";

export type CheckStatus = "pass" | "fail" | "skip";

export type CheckResultBase = {
  name: string;
  status: CheckStatus;
  message: string;
  details?: string[];
};

export type FixResult = {
  success: boolean;
  message: string;
};

export type CheckResult = CheckResultBase & {
  group: string;
};

export type CheckScope =
  | "universal"
  | "node"
  | "typescript";

export type CheckRequirement = "required" | "recommended" | "opinionated";

export type CheckTool = `tool:${string}`;

export type CheckEffort = "effort:low" | "effort:medium" | "effort:high";

export type CheckTag = CheckScope | CheckRequirement | CheckTool | CheckEffort;

export type FileCache = {
  readText(relativePath: string): Promise<string | null>;
  readJson<T>(relativePath: string): Promise<T | null>;
  exists(relativePath: string): Promise<boolean>;
};

export type DetectedTools = {
  packageManager: "npm" | "yarn" | "pnpm" | null;
  hasTypeScript: boolean;
  hasEslint: boolean;
  hasPrettier: boolean;
  hasDocker: boolean;
  hasKnip: boolean;
  hasSizeLimit: boolean;
  isMonorepo: boolean;
};

export type GlobalContext = {
  projectPath: string;
  detected: DetectedTools;
  files: FileCache;
  config: ResolvedConfig;
};

export type Check<GroupCtx = unknown> = {
  name: string;
  description: string;
  tags: CheckTag[];
  run: (global: GlobalContext, group: GroupCtx) => Promise<CheckResultBase>;
  fix?: {
    description: string;
    run: (global: GlobalContext, group: GroupCtx) => Promise<FixResult>;
  };
};

export type GroupContextLoader<T> = (global: GlobalContext) => Promise<T>;

export type CheckGroup<GroupCtx = unknown> = {
  name: string;
  loadContext: GroupContextLoader<GroupCtx>;
  checks: Check<GroupCtx>[];
};
