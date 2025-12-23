export type Config = {
  groups?: string[];
  includeTags?: string[];
  excludeTags?: string[];
  excludeChecks?: string[];
};

export type ResolvedConfig = {
  groups: string[];
  includeTags: string[];
  excludeTags: string[];
  excludeChecks: string[];
};

export const DEFAULT_CONFIG: ResolvedConfig = {
  groups: [],
  includeTags: [],
  excludeTags: [],
  excludeChecks: [],
};
