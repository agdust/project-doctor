export type Config = {
  groups?: string[];
  includeTags?: string[];
  excludeTags?: string[];
  excludeChecks?: string[];
  // User has confirmed they allow eslint config overwriting
  eslintOverwriteConfirmed?: boolean;
};

export type ResolvedConfig = {
  groups: string[];
  includeTags: string[];
  excludeTags: string[];
  excludeChecks: string[];
  eslintOverwriteConfirmed: boolean;
};

export const DEFAULT_CONFIG: ResolvedConfig = {
  groups: [],
  includeTags: [],
  excludeTags: [],
  excludeChecks: [],
  eslintOverwriteConfirmed: false,
};
