import type { Check, CheckResultBase } from "../../types.js";
import type { DocsContext } from "./context.js";

function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

export const readmeExists: Check<DocsContext> = {
  name: "readme-exists",
  description: "Check if README.md exists",
  tags: ["universal", "required"],
  run: async (_global, { readme }) => {
    if (!readme) return fail("readme-exists", "README.md not found");
    return pass("readme-exists", "README.md exists");
  },
};

export const readmeHasTitle: Check<DocsContext> = {
  name: "readme-has-title",
  description: "Check if README.md has a title",
  tags: ["universal", "recommended"],
  run: async (_global, { readme }) => {
    if (!readme) return skip("readme-has-title", "No README.md");
    if (!readme.startsWith("#")) {
      return fail("readme-has-title", "README.md missing title (# heading)");
    }
    return pass("readme-has-title", "README.md has title");
  },
};

export const readmeHasInstall: Check<DocsContext> = {
  name: "readme-has-install-section",
  description: "Check if README.md has installation instructions",
  tags: ["universal", "recommended"],
  run: async (_global, { readme }) => {
    if (!readme) return skip("readme-has-install-section", "No README.md");
    const hasInstall = /##.*install/i.test(readme) || /##.*getting started/i.test(readme);
    if (!hasInstall) {
      return fail("readme-has-install-section", "No installation section");
    }
    return pass("readme-has-install-section", "Installation section present");
  },
};

export const readmeHasUsage: Check<DocsContext> = {
  name: "readme-has-usage-section",
  description: "Check if README.md has usage instructions",
  tags: ["universal", "recommended"],
  run: async (_global, { readme }) => {
    if (!readme) return skip("readme-has-usage-section", "No README.md");
    const hasUsage = /##.*usage/i.test(readme) || /##.*example/i.test(readme);
    if (!hasUsage) {
      return fail("readme-has-usage-section", "No usage section");
    }
    return pass("readme-has-usage-section", "Usage section present");
  },
};

export const licenseExists: Check<DocsContext> = {
  name: "license-exists",
  description: "Check if LICENSE file exists",
  tags: ["universal", "recommended"],
  run: async (_global, { license }) => {
    if (!license) return fail("license-exists", "LICENSE file not found");
    return pass("license-exists", "LICENSE file exists");
  },
};

export const changelogExists: Check<DocsContext> = {
  name: "changelog-exists",
  description: "Check if CHANGELOG.md exists",
  tags: ["universal", "recommended"],
  run: async (_global, { changelog }) => {
    if (!changelog) return fail("changelog-exists", "CHANGELOG.md not found");
    return pass("changelog-exists", "CHANGELOG.md exists");
  },
};

export const contributingExists: Check<DocsContext> = {
  name: "contributing-exists",
  description: "Check if CONTRIBUTING.md exists",
  tags: ["universal", "opinionated"],
  run: async (_global, { contributing }) => {
    if (!contributing) return fail("contributing-exists", "CONTRIBUTING.md not found");
    return pass("contributing-exists", "CONTRIBUTING.md exists");
  },
};

export const checks = [
  readmeExists,
  readmeHasTitle,
  readmeHasInstall,
  readmeHasUsage,
  licenseExists,
  changelogExists,
  contributingExists,
];
