export type CheckStatus = "pass" | "fail" | "warn" | "skip";

export type CheckResult = {
  name: string;
  status: CheckStatus;
  message: string;
  details?: string[];
};

export type Check = {
  name: string;
  description: string;
  run: (projectPath: string) => Promise<CheckResult>;
};

export type CheckCategory = "health" | "setup" | "migration";

export type CheckModule = {
  category: CheckCategory;
  checks: Check[];
};
