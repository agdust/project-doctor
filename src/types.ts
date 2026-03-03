import type { ResolvedConfig } from "./config/types.js";

// ============================================================================
// PackageJson — unified type used across all check groups and detection
// ============================================================================

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  type?: "module" | "commonjs";
  main?: string;
  exports?: unknown;
  engines?: {
    node?: string;
    npm?: string;
  };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
  packageManager?: string;
  "size-limit"?: unknown[];
}

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
  run: (global: GlobalContext, group: GroupCtx) => Promise<FixResult> | FixResult;
}

export type CheckResult = CheckResultBase & {
  group: string;
};

// ============================================================================
// Tag System — 2-level typed constants
// ============================================================================

/** Helper: auto-generates `{ key: "prefix:key" }` from keys */
function tagGroup<const P extends string, const K extends string>(
  prefix: P,
  keys: K[],
): { readonly [V in K]: `${P}:${V}` } {
  const result = {} as Record<string, string>;
  for (const key of keys) {
    result[key] = `${prefix}:${key}`;
  }
  return result as { readonly [V in K]: `${P}:${V}` };
}

export const TAG = {
  // Simple tags (no colon, flat)
  universal: "universal",
  node: "node",
  typescript: "typescript",
  required: "required",
  recommended: "recommended",
  opinionated: "opinionated",
  security: "security",

  // Grouped tags (colon-separated, 2-level)
  tool: tagGroup("tool", ["eslint", "prettier", "knip", "jscpd", "size-limit"]),
  effort: tagGroup("effort", ["low", "medium", "high"]),
  source: tagGroup("source", ["lirantal-npm-security"]),
} as const;

type TagValues<T> = T extends string ? T : T extends Record<string, infer V> ? V : never;
export type CheckTag = TagValues<(typeof TAG)[keyof typeof TAG]>;

export type CheckScope = typeof TAG.universal | typeof TAG.node | typeof TAG.typescript;
export type CheckRequirement =
  | typeof TAG.required
  | typeof TAG.recommended
  | typeof TAG.opinionated;
export type CheckEffort = (typeof TAG.effort)[keyof typeof TAG.effort];
export type CheckTool = (typeof TAG.tool)[keyof typeof TAG.tool];
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
  run: (global: GlobalContext, group: GroupCtx) => Promise<FixResult> | FixResult;
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
  run: (global: GlobalContext, group: GroupCtx) => Promise<CheckResultBase> | CheckResultBase;
  fix?: Fix<GroupCtx>;
}

export type GroupContextLoader<T> = (global: GlobalContext) => Promise<T> | T;

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
