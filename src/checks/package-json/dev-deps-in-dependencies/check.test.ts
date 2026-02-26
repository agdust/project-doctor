import { describe, it, expect } from "vitest";
import { check } from "./check.js";
import type { PackageJsonContext } from "../context.js";
import type { GlobalContext } from "../../../types.js";
import { DEFAULT_CONFIG } from "../../../config/types.js";
import type { ResolvedConfig } from "../../../config/types.js";

function makeGlobal(configOverrides?: Partial<ResolvedConfig>): GlobalContext {
  return {
    projectPath: "/fake",
    detected: {
      packageManager: "npm",
      hasTypeScript: false,
      hasEslint: false,
      hasPrettier: false,
      hasDocker: false,
      hasKnip: false,
      hasSizeLimit: false,
      hasJscpd: false,
      isMonorepo: false,
    },
    files: {
      readText: async () => null,
      readJson: async () => null,
      exists: async () => false,
    },
    config: { ...DEFAULT_CONFIG, ...configOverrides },
  };
}

function makeContext(dependencies?: Record<string, string>): PackageJsonContext {
  if (dependencies === undefined) {
    return { raw: null, parsed: null, parseError: null };
  }
  return {
    raw: JSON.stringify({ dependencies }),
    parsed: { dependencies },
    parseError: null,
  };
}

describe("package-json-dev-deps-in-dependencies", () => {
  it("should skip when no package.json", () => {
    const global = makeGlobal();
    const ctx = makeContext();
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "skip" });
  });

  it("should pass when dependencies is empty", () => {
    const global = makeGlobal();
    const ctx = makeContext({});
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "pass", message: "No dependencies" });
  });

  it("should pass when all dependencies are production packages", () => {
    const global = makeGlobal();
    const ctx = makeContext({ express: "^4.0.0", lodash: "^4.17.0", zod: "^3.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "pass" });
  });

  // Exact match detection
  it("should fail when eslint is in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ express: "^4.0.0", eslint: "^8.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("eslint");
    expect(result.details).toContainEqual(expect.stringContaining("eslint"));
  });

  it("should fail when typescript is in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ typescript: "^5.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("typescript");
  });

  it("should fail when jest is in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ jest: "^29.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("jest");
  });

  it("should detect multiple dev-only packages", () => {
    const global = makeGlobal();
    const ctx = makeContext({
      express: "^4.0.0",
      eslint: "^8.0.0",
      prettier: "^3.0.0",
      vitest: "^1.0.0",
    });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("3 dev-only package(s)");
    expect(result.message).toContain("eslint");
    expect(result.message).toContain("prettier");
    expect(result.message).toContain("vitest");
  });

  // Prefix pattern detection
  it("should fail when @types/ packages are in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ "@types/node": "^20.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("@types/node");
    expect(result.details).toContainEqual(expect.stringContaining("Type definitions"));
  });

  it("should fail when eslint-plugin-* is in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ "eslint-plugin-react": "^7.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("eslint-plugin-react");
  });

  it("should fail when eslint-config-* is in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ "eslint-config-airbnb": "^19.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("eslint-config-airbnb");
  });

  it("should fail when @eslint/* is in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ "@eslint/js": "^9.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("@eslint/js");
  });

  it("should fail when @typescript-eslint/* is in dependencies", () => {
    const global = makeGlobal();
    const ctx = makeContext({ "@typescript-eslint/parser": "^7.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("@typescript-eslint/parser");
  });

  // Mix of exact and prefix matches
  it("should detect both exact matches and prefix patterns", () => {
    const global = makeGlobal();
    const ctx = makeContext({
      express: "^4.0.0",
      typescript: "^5.0.0",
      "@types/express": "^4.0.0",
    });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("2 dev-only package(s)");
  });

  // Exceptions via config
  it("should respect exceptions from config", () => {
    const global = makeGlobal({
      checks: {
        "package-json-dev-deps-in-dependencies": [
          "error",
          { exceptions: ["eslint", "prettier"] },
        ],
      },
    });
    const ctx = makeContext({ eslint: "^8.0.0", prettier: "^3.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "pass" });
  });

  it("should only exclude listed exceptions", () => {
    const global = makeGlobal({
      checks: {
        "package-json-dev-deps-in-dependencies": ["error", { exceptions: ["eslint"] }],
      },
    });
    const ctx = makeContext({ eslint: "^8.0.0", prettier: "^3.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("prettier");
    expect(result.message).not.toContain("eslint");
  });

  it("should handle exceptions for prefix-matched packages", () => {
    const global = makeGlobal({
      checks: {
        "package-json-dev-deps-in-dependencies": [
          "error",
          { exceptions: ["@types/node"] },
        ],
      },
    });
    const ctx = makeContext({ "@types/node": "^20.0.0", "@types/express": "^4.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("@types/express");
    expect(result.message).not.toContain("@types/node");
  });

  // Edge cases for config options
  it("should handle no config options gracefully", () => {
    const global = makeGlobal({ checks: {} });
    const ctx = makeContext({ lodash: "^4.17.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "pass" });
  });

  it("should handle plain severity string in config (no options)", () => {
    const global = makeGlobal({
      checks: { "package-json-dev-deps-in-dependencies": "error" },
    });
    const ctx = makeContext({ eslint: "^8.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
  });

  it("should handle invalid exceptions value gracefully", () => {
    const global = makeGlobal({
      checks: {
        "package-json-dev-deps-in-dependencies": ["error", { exceptions: "not-an-array" }],
      },
    });
    const ctx = makeContext({ eslint: "^8.0.0" });
    const result = check.run(global, ctx);

    // Should still detect eslint since exceptions is not an array
    expect(result).toMatchObject({ status: "fail" });
    expect(result.message).toContain("eslint");
  });

  // Details content
  it("should include reasons in details", () => {
    const global = makeGlobal();
    const ctx = makeContext({ husky: "^9.0.0", webpack: "^5.0.0" });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "fail" });
    expect(result.details).toHaveLength(2);
    expect(result.details).toContainEqual(expect.stringContaining("husky"));
    expect(result.details).toContainEqual(expect.stringContaining("webpack"));
    expect(result.details).toContainEqual(expect.stringContaining("Git hooks manager"));
    expect(result.details).toContainEqual(expect.stringContaining("Bundler"));
  });

  // All exact-match packages
  it("should detect all known dev-only exact-match packages", () => {
    const devOnlyPackages = [
      "eslint",
      "prettier",
      "typescript",
      "ts-node",
      "tsx",
      "jest",
      "vitest",
      "mocha",
      "chai",
      "sinon",
      "c8",
      "nyc",
      "webpack",
      "rollup",
      "esbuild",
      "vite",
      "parcel",
      "turbo",
      "husky",
      "lint-staged",
      "commitlint",
      "nodemon",
      "concurrently",
      "npm-run-all",
      "npm-run-all2",
      "rimraf",
      "size-limit",
      "knip",
    ];

    const global = makeGlobal();

    for (const pkg of devOnlyPackages) {
      const ctx = makeContext({ [pkg]: "^1.0.0" });
      const result = check.run(global, ctx);
      expect(result.status).toBe("fail");
    }
  });

  // Non-matching packages that look similar
  it("should not flag packages that are not in the dev-only list", () => {
    const global = makeGlobal();
    const ctx = makeContext({
      "eslint-scope": "^7.0.0", // not a prefix match
      "typescript-is": "^0.19.0",
      "vite-plugin-pwa": "^0.14.0",
    });
    const result = check.run(global, ctx);

    expect(result).toMatchObject({ status: "pass" });
  });
});
