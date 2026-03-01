import { describe, it, expect } from "vitest";
import { check as sizeLimitInstalled } from "./size-limit-installed/check.js";
import { check as sizeLimitConfigured } from "./size-limit-configured/check.js";
import { check as sizeLimitScript } from "./size-limit-script/check.js";
import type { GlobalContext } from "../../types.js";
import type { BundleSizeContext } from "./context.js";

function mockGlobal(overrides: Partial<GlobalContext["detected"]> = {}): GlobalContext {
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
      ...overrides,
    },
    files: {} as GlobalContext["files"],
    config: {} as GlobalContext["config"],
  };
}

function mockCtx(overrides: Partial<BundleSizeContext> = {}): BundleSizeContext {
  return {
    hasSizeLimitConfig: false,
    hasSizeLimitScript: false,
    configLocation: null,
    ...overrides,
  };
}

describe("bundle-size checks", () => {
  describe("size-limit-installed", () => {
    it("should pass when size-limit is detected", async () => {
      const global = mockGlobal({ hasSizeLimit: true });
      const result = sizeLimitInstalled.run(global, mockCtx());

      expect(result.status).toBe("pass");
      expect(result.message).toContain("installed");
    });

    it("should fail when size-limit is not detected", () => {
      const global = mockGlobal({ hasSizeLimit: false });
      const result = sizeLimitInstalled.run(global, mockCtx());

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not installed");
    });
  });

  describe("size-limit-configured", () => {
    it("should pass when size-limit is installed and configured in file", () => {
      const global = mockGlobal({ hasSizeLimit: true });
      const ctx = mockCtx({ hasSizeLimitConfig: true, configLocation: "file" });
      const result = sizeLimitConfigured.run(global, ctx);

      expect(result.status).toBe("pass");
      expect(result.message).toContain(".size-limit.json");
    });

    it("should pass when size-limit is configured in package.json", () => {
      const global = mockGlobal({ hasSizeLimit: true });
      const ctx = mockCtx({ hasSizeLimitConfig: true, configLocation: "package" });
      const result = sizeLimitConfigured.run(global, ctx);

      expect(result.status).toBe("pass");
      expect(result.message).toContain("package.json");
    });

    it("should fail when size-limit is installed but not configured", () => {
      const global = mockGlobal({ hasSizeLimit: true });
      const ctx = mockCtx({ hasSizeLimitConfig: false });
      const result = sizeLimitConfigured.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("not found");
    });

    it("should skip when size-limit is not installed", () => {
      const global = mockGlobal({ hasSizeLimit: false });
      const ctx = mockCtx();
      const result = sizeLimitConfigured.run(global, ctx);

      expect(result.status).toBe("skip");
      expect(result.message).toContain("not installed");
    });
  });

  describe("size-limit-script", () => {
    it("should pass when size-limit is installed and script exists", () => {
      const global = mockGlobal({ hasSizeLimit: true });
      const ctx = mockCtx({ hasSizeLimitScript: true });
      const result = sizeLimitScript.run(global, ctx);

      expect(result.status).toBe("pass");
      expect(result.message).toContain("script found");
    });

    it("should fail when size-limit is installed but no script", () => {
      const global = mockGlobal({ hasSizeLimit: true });
      const ctx = mockCtx({ hasSizeLimitScript: false });
      const result = sizeLimitScript.run(global, ctx);

      expect(result.status).toBe("fail");
      expect(result.message).toContain("no npm script");
    });

    it("should skip when size-limit is not installed", () => {
      const global = mockGlobal({ hasSizeLimit: false });
      const ctx = mockCtx();
      const result = sizeLimitScript.run(global, ctx);

      expect(result.status).toBe("skip");
      expect(result.message).toContain("not installed");
    });
  });
});
