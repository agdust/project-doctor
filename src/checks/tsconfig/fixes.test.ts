import { describe, it, expect, afterEach } from "vitest";
import { createGlobalContext } from "../../context/global.js";
import { loadContext } from "./context.js";
import { copyFixtureToTemp, createEmptyTempDir, type TempFixture } from "../../test/fix-test-utils.js";
import { check as exists } from "./exists/check.js";
import { check as strictEnabled } from "./strict-enabled/check.js";
import { check as noAnyEnabled } from "./no-any-enabled/check.js";
import { check as hasOutdir } from "./has-outdir/check.js";
import { check as pathsValid } from "./paths-valid/check.js";

describe("tsconfig fixes", () => {
  let tempFixture: TempFixture;

  afterEach(async () => {
    if (tempFixture) {
      await tempFixture.cleanup();
    }
  });

  describe("exists fix", () => {
    it("should create tsconfig.json with Node.js defaults", async () => {
      tempFixture = await createEmptyTempDir("tsconfig-exists");
      // Create a minimal package.json so it's treated as a project
      await tempFixture.writeJson("package.json", { name: "test" });

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await exists.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = exists.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify tsconfig.json was created
      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      expect(tsconfig.compilerOptions).toBeDefined();
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);
      expect((tsconfig.compilerOptions as Record<string, unknown>).outDir).toBe("dist");
      expect((tsconfig.compilerOptions as Record<string, unknown>).module).toBe("NodeNext");
      expect((tsconfig.compilerOptions as Record<string, unknown>).moduleResolution).toBe("NodeNext");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await exists.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should include standard TypeScript options", async () => {
      tempFixture = await createEmptyTempDir("tsconfig-exists-options");
      await tempFixture.writeJson("package.json", { name: "test" });

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = exists.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      const opts = tsconfig.compilerOptions as Record<string, unknown>;

      expect(opts.target).toBe("ES2022");
      expect(opts.esModuleInterop).toBe(true);
      expect(opts.skipLibCheck).toBe(true);
      expect(opts.declaration).toBe(true);
      expect(tsconfig.include).toEqual(["src/**/*"]);
      expect(tsconfig.exclude).toContain("node_modules");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await exists.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("strict-enabled fix", () => {
    it("should enable strict mode using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (fixable has strict: false implicit)
      const checkResult = await strictEnabled.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = strictEnabled.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify tsconfig.json was updated
      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await strictEnabled.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should preserve existing compiler options", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = strictEnabled.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      const opts = tsconfig.compilerOptions as Record<string, unknown>;
      // Original values should be preserved
      expect(opts.target).toBe("ES2020");
      expect(opts.module).toBe("CommonJS");
      // New value added
      expect(opts.strict).toBe(true);
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await strictEnabled.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("no-any-enabled fix", () => {
    it("should enable noImplicitAny using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await noAnyEnabled.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = noAnyEnabled.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify tsconfig.json was updated
      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      expect((tsconfig.compilerOptions as Record<string, unknown>).noImplicitAny).toBe(true);

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await noAnyEnabled.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should pass for healthy project (no fix needed - has strict)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Healthy project has strict: true which implies noImplicitAny
      const checkResult = await noAnyEnabled.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("has-outdir fix", () => {
    it("should set outDir to dist using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await hasOutdir.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = hasOutdir.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify tsconfig.json was updated
      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      expect((tsconfig.compilerOptions as Record<string, unknown>).outDir).toBe("dist");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasOutdir.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasOutdir.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("paths-valid fix", () => {
    it("should add baseUrl when paths exist using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (fixable has paths but no baseUrl)
      const checkResult = await pathsValid.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = pathsValid.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify tsconfig.json was updated
      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      expect((tsconfig.compilerOptions as Record<string, unknown>).baseUrl).toBe(".");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await pathsValid.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should preserve existing paths", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = pathsValid.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      const opts = tsconfig.compilerOptions as Record<string, unknown>;
      expect(opts.baseUrl).toBe(".");
      expect((opts.paths as Record<string, string[]>)["@/*"]).toEqual(["src/*"]);
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Healthy project doesn't have paths, so it passes
      const checkResult = await pathsValid.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("fix idempotency", () => {
    it("should be safe to run strict fix twice", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = strictEnabled.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);
      await fix.run(global, ctx);

      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);
    });
  });

  describe("fix error handling", () => {
    it("should fail gracefully when tsconfig.json does not exist", async () => {
      tempFixture = await createEmptyTempDir("tsconfig-error");
      await tempFixture.writeJson("package.json", { name: "test" });

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = strictEnabled.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const result = await fix.run(global, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Could not read");
    });
  });

  describe("creates compilerOptions if missing", () => {
    it("should create compilerOptions object if not present", async () => {
      tempFixture = await createEmptyTempDir("tsconfig-empty");
      await tempFixture.writeJson("package.json", { name: "test" });
      await tempFixture.writeJson("tsconfig.json", {});

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = strictEnabled.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await tempFixture.readJson<Record<string, unknown>>("tsconfig.json");
      expect(tsconfig.compilerOptions).toBeDefined();
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);
    });
  });

  describe("broken fixture tests", () => {
    it("should detect strict: false in broken fixture", async () => {
      tempFixture = await copyFixtureToTemp("broken");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Broken project has strict: false explicitly
      const checkResult = await strictEnabled.run(global, ctx);
      expect(checkResult.status).toBe("fail");
    });
  });
});
