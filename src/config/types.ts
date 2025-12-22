export type TestingFramework = "jest" | "vitest" | "playwright" | "cypress";

export type PackageJsonOptions = {
  requiredScripts?: string[];
};

export type DocsOptions = {
  requiredFiles?: string[];
  optionalFiles?: string[];
};

export type TestingOptions = {
  frameworks?: TestingFramework[];
};

export type EnvOptions = {
  exampleFile?: string;
};

export type GitignoreOptions = {
  requiredPatterns?: string[];
};

export type GroupOptions = {
  "package-json"?: PackageJsonOptions;
  docs?: DocsOptions;
  testing?: TestingOptions;
  env?: EnvOptions;
  gitignore?: GitignoreOptions;
};

export type SeverityOverride = "fail" | "warn" | "skip";

export type Config = {
  checks?: {
    groups?: string[];
    include?: string[];
    exclude?: string[];
    disable?: string[];
  };
  options?: GroupOptions;
  severity?: Record<string, SeverityOverride>;
};

export type ResolvedConfig = {
  checks: {
    groups: string[];
    include: string[];
    exclude: string[];
    disable: string[];
  };
  options: {
    "package-json": Required<PackageJsonOptions>;
    docs: Required<DocsOptions>;
    testing: Required<TestingOptions>;
    env: Required<EnvOptions>;
    gitignore: Required<GitignoreOptions>;
  };
  severity: Record<string, SeverityOverride>;
};

export const DEFAULT_CONFIG: ResolvedConfig = {
  checks: {
    groups: [],
    include: [],
    exclude: [],
    disable: [],
  },
  options: {
    "package-json": {
      requiredScripts: ["build", "dev", "test", "lint", "format"],
    },
    docs: {
      requiredFiles: ["README.md"],
      optionalFiles: ["LICENSE", "CHANGELOG.md", "CONTRIBUTING.md"],
    },
    testing: {
      frameworks: ["jest", "vitest", "playwright", "cypress"],
    },
    env: {
      exampleFile: ".env.example",
    },
    gitignore: {
      requiredPatterns: [],
    },
  },
  severity: {},
};
