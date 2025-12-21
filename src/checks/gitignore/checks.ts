import type { Check, CheckResult } from "../../types.ts";
import type { GitignoreContext } from "./context.ts";

function skip(name: string, message: string): CheckResult {
  return { name, status: "skip", message };
}

function pass(name: string, message: string): CheckResult {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResult {
  return { name, status: "fail", message };
}

function warn(name: string, message: string): CheckResult {
  return { name, status: "warn", message };
}

export const exists: Check<GitignoreContext> = {
  name: "gitignore-exists",
  description: "Check if .gitignore exists",
  tags: ["universal", "required"],
  run: async (_global, { raw }) => {
    if (!raw) return fail("gitignore-exists", ".gitignore not found");
    return pass("gitignore-exists", ".gitignore exists");
  },
};

export const hasNodeModules: Check<GitignoreContext> = {
  name: "gitignore-has-node-modules",
  description: "Check if node_modules is ignored",
  tags: ["node", "required"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip("gitignore-has-node-modules", "No .gitignore");
    const hasIt = patterns.some((p) => p === "node_modules" || p === "node_modules/");
    if (!hasIt) return fail("gitignore-has-node-modules", "node_modules not ignored");
    return pass("gitignore-has-node-modules", "node_modules ignored");
  },
};

export const hasDist: Check<GitignoreContext> = {
  name: "gitignore-has-dist",
  description: "Check if dist/build output is ignored",
  tags: ["node", "recommended"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip("gitignore-has-dist", "No .gitignore");
    const hasIt = patterns.some((p) =>
      ["dist", "dist/", "build", "build/", "out", "out/"].includes(p)
    );
    if (!hasIt) return warn("gitignore-has-dist", "No dist/build ignored");
    return pass("gitignore-has-dist", "Build output ignored");
  },
};

export const hasEnv: Check<GitignoreContext> = {
  name: "gitignore-has-env",
  description: "Check if .env files are ignored",
  tags: ["universal", "required"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip("gitignore-has-env", "No .gitignore");
    const hasIt = patterns.some((p) =>
      [".env", ".env.local", ".env*.local", "*.env"].includes(p) || p.startsWith(".env")
    );
    if (!hasIt) return fail("gitignore-has-env", ".env files not ignored");
    return pass("gitignore-has-env", ".env files ignored");
  },
};

export const noDuplicates: Check<GitignoreContext> = {
  name: "gitignore-no-duplicates",
  description: "Check for duplicate patterns in .gitignore",
  tags: ["universal", "recommended"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip("gitignore-no-duplicates", "No .gitignore");
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const p of patterns) {
      if (seen.has(p)) {
        duplicates.push(p);
      }
      seen.add(p);
    }
    if (duplicates.length > 0) {
      return warn("gitignore-no-duplicates", `Duplicates: ${duplicates.join(", ")}`);
    }
    return pass("gitignore-no-duplicates", "No duplicates");
  },
};

export const noSecretsCommitted: Check<GitignoreContext> = {
  name: "gitignore-no-secrets-committed",
  description: "Check that common secret files are ignored",
  tags: ["universal", "required"],
  run: async (global, { raw, patterns }) => {
    if (!raw) return skip("gitignore-no-secrets-committed", "No .gitignore");

    const secretFiles = [".env", ".env.local", "credentials.json", "secrets.json", ".npmrc"];
    const notIgnored: string[] = [];

    for (const file of secretFiles) {
      const exists = await global.files.exists(file);
      if (exists) {
        const isIgnored = patterns.some((p) => p === file || file.match(new RegExp(`^${p.replace("*", ".*")}$`)));
        if (!isIgnored) {
          notIgnored.push(file);
        }
      }
    }

    if (notIgnored.length > 0) {
      return fail("gitignore-no-secrets-committed", `Secret files not ignored: ${notIgnored.join(", ")}`);
    }
    return pass("gitignore-no-secrets-committed", "Secret files properly ignored");
  },
};

export const projectTypePatterns: Check<GitignoreContext> = {
  name: "gitignore-project-type-patterns",
  description: "Check for framework-specific ignore patterns",
  tags: ["node", "recommended"],
  run: async (global, { raw, patterns }) => {
    if (!raw) return skip("gitignore-project-type-patterns", "No .gitignore");

    const missing: string[] = [];

    if (global.detected.hasSvelte) {
      if (!patterns.some((p) => p.includes(".svelte-kit"))) {
        missing.push(".svelte-kit");
      }
    }

    if (missing.length > 0) {
      return warn("gitignore-project-type-patterns", `Missing patterns: ${missing.join(", ")}`);
    }
    return pass("gitignore-project-type-patterns", "Framework patterns present");
  },
};

export const checks = [
  exists,
  hasNodeModules,
  hasDist,
  hasEnv,
  noDuplicates,
  noSecretsCommitted,
  projectTypePatterns,
];
