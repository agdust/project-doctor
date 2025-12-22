import type { Check, CheckResultBase } from "../../types.js";
import type { PackageJsonContext } from "./context.js";

function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

export const exists: Check<PackageJsonContext> = {
  name: "package-json-exists",
  description: "Check if package.json exists",
  tags: ["node", "required"],
  run: async (_global, { raw }) => {
    if (!raw) return fail("package-json-exists", "package.json not found");
    return pass("package-json-exists", "package.json exists");
  },
};

export const valid: Check<PackageJsonContext> = {
  name: "package-json-valid",
  description: "Check if package.json is valid JSON",
  tags: ["node", "required"],
  run: async (_global, { raw, parseError }) => {
    if (!raw) return skip("package-json-valid", "No package.json");
    if (parseError) return fail("package-json-valid", `Invalid JSON: ${parseError}`);
    return pass("package-json-valid", "Valid JSON");
  },
};

export const hasName: Check<PackageJsonContext> = {
  name: "package-json-has-name",
  description: "Check if package.json has name field",
  tags: ["node", "required"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-has-name", "No package.json");
    if (!parsed.name) return fail("package-json-has-name", "Missing name field");
    return pass("package-json-has-name", `Name: ${parsed.name}`);
  },
};

export const hasVersion: Check<PackageJsonContext> = {
  name: "package-json-has-version",
  description: "Check if package.json has version field",
  tags: ["node", "required"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-has-version", "No package.json");
    if (!parsed.version) return fail("package-json-has-version", "Missing version field");
    return pass("package-json-has-version", `Version: ${parsed.version}`);
  },
};

export const hasDescription: Check<PackageJsonContext> = {
  name: "package-json-has-description",
  description: "Check if package.json has description field",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-has-description", "No package.json");
    if (!parsed.description) return fail("package-json-has-description", "Missing description");
    return pass("package-json-has-description", "Description present");
  },
};

export const hasLicense: Check<PackageJsonContext> = {
  name: "package-json-has-license",
  description: "Check if package.json has license field",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-has-license", "No package.json");
    if (!parsed.license) return fail("package-json-has-license", "Missing license field");
    return pass("package-json-has-license", `License: ${parsed.license}`);
  },
};

export const hasEngines: Check<PackageJsonContext> = {
  name: "package-json-has-engines",
  description: "Check if package.json specifies Node engine version",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-has-engines", "No package.json");
    if (!parsed.engines?.node) return fail("package-json-has-engines", "Missing engines.node");
    return pass("package-json-has-engines", `Node: ${parsed.engines.node}`);
  },
};

export const typeModule: Check<PackageJsonContext> = {
  name: "package-json-type-module",
  description: "Check if package.json has type: module for ESM",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-type-module", "No package.json");
    if (parsed.type !== "module") return fail("package-json-type-module", "Not using ESM (type: module)");
    return pass("package-json-type-module", "Using ESM");
  },
};

export const hasMainOrExports: Check<PackageJsonContext> = {
  name: "package-json-has-main-or-exports",
  description: "Check if package.json has main or exports entry point",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-has-main-or-exports", "No package.json");
    if (!parsed.main && !parsed.exports) {
      return fail("package-json-has-main-or-exports", "No main or exports field");
    }
    return pass("package-json-has-main-or-exports", "Entry point defined");
  },
};

export const scriptsBuild: Check<PackageJsonContext> = {
  name: "package-json-scripts-build",
  description: "Check if build script exists",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-scripts-build", "No package.json");
    if (!parsed.scripts?.build) return fail("package-json-scripts-build", "No build script");
    return pass("package-json-scripts-build", "Build script present");
  },
};

export const scriptsDev: Check<PackageJsonContext> = {
  name: "package-json-scripts-dev",
  description: "Check if dev script exists",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-scripts-dev", "No package.json");
    if (!parsed.scripts?.dev) return fail("package-json-scripts-dev", "No dev script");
    return pass("package-json-scripts-dev", "Dev script present");
  },
};

export const scriptsTest: Check<PackageJsonContext> = {
  name: "package-json-scripts-test",
  description: "Check if test script exists",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-scripts-test", "No package.json");
    if (!parsed.scripts?.test) return fail("package-json-scripts-test", "No test script");
    return pass("package-json-scripts-test", "Test script present");
  },
};

export const scriptsLint: Check<PackageJsonContext> = {
  name: "package-json-scripts-lint",
  description: "Check if lint script exists",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-scripts-lint", "No package.json");
    if (!parsed.scripts?.lint) return fail("package-json-scripts-lint", "No lint script");
    return pass("package-json-scripts-lint", "Lint script present");
  },
};

export const scriptsFormat: Check<PackageJsonContext> = {
  name: "package-json-scripts-format",
  description: "Check if format script exists",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-scripts-format", "No package.json");
    if (!parsed.scripts?.format) return fail("package-json-scripts-format", "No format script");
    return pass("package-json-scripts-format", "Format script present");
  },
};

export const depsNoDuplicates: Check<PackageJsonContext> = {
  name: "package-json-deps-no-duplicates",
  description: "Check that no package is in both dependencies and devDependencies",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-deps-no-duplicates", "No package.json");
    const deps = Object.keys(parsed.dependencies ?? {});
    const devDeps = Object.keys(parsed.devDependencies ?? {});
    const duplicates = deps.filter((d) => devDeps.includes(d));
    if (duplicates.length > 0) {
      return fail("package-json-deps-no-duplicates", `Duplicates: ${duplicates.join(", ")}`);
    }
    return pass("package-json-deps-no-duplicates", "No duplicates");
  },
};

export const depsSorted: Check<PackageJsonContext> = {
  name: "package-json-deps-sorted",
  description: "Check if dependencies are sorted alphabetically",
  tags: ["node", "opinionated"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip("package-json-deps-sorted", "No package.json");

    const checkSorted = (deps: Record<string, string> | undefined, name: string): string | null => {
      if (!deps) return null;
      const keys = Object.keys(deps);
      const sorted = [...keys].sort((a, b) => a.localeCompare(b));
      if (keys.join(",") !== sorted.join(",")) return name;
      return null;
    };

    const unsorted = [
      checkSorted(parsed.dependencies, "dependencies"),
      checkSorted(parsed.devDependencies, "devDependencies"),
    ].filter(Boolean);

    if (unsorted.length > 0) {
      return fail("package-json-deps-sorted", `Unsorted: ${unsorted.join(", ")}`);
    }
    return pass("package-json-deps-sorted", "Dependencies sorted");
  },
};

export const checks = [
  exists,
  valid,
  hasName,
  hasVersion,
  hasDescription,
  hasLicense,
  hasEngines,
  typeModule,
  hasMainOrExports,
  scriptsBuild,
  scriptsDev,
  scriptsTest,
  scriptsLint,
  scriptsFormat,
  depsNoDuplicates,
  depsSorted,
];
