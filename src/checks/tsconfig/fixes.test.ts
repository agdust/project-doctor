import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGlobalContext } from "../../context/global.js";
import { loadContext } from "./context.js";
import { check as exists } from "./exists/check.js";
import { check as strictEnabled } from "./strict-enabled/check.js";
import { check as noAnyEnabled } from "./no-any-enabled/check.js";
import { check as hasOutdir } from "./has-outdir/check.js";
import { check as pathsValid } from "./paths-valid/check.js";

describe("tsconfig fixes", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "tsconfig-fix-test-"));
    // Create a minimal package.json so it's treated as a project
    await writeFile(join(tempDir, "package.json"), JSON.stringify({ name: "test" }));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function createTsconfig(content: Record<string, unknown>) {
    await writeFile(join(tempDir, "tsconfig.json"), JSON.stringify(content, null, 2));
  }

  async function readTsconfig(): Promise<Record<string, unknown>> {
    const content = await readFile(join(tempDir, "tsconfig.json"), "utf-8");
    return JSON.parse(content);
  }

  describe("exists fix", () => {
    it("should create tsconfig.json with Node.js defaults", async () => {
      // Don't create tsconfig.json

      const global = await createGlobalContext(tempDir);
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
      const tsconfig = await readTsconfig();
      expect(tsconfig.compilerOptions).toBeDefined();
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);
      expect((tsconfig.compilerOptions as Record<string, unknown>).outDir).toBe("dist");
      expect((tsconfig.compilerOptions as Record<string, unknown>).module).toBe("NodeNext");
      expect((tsconfig.compilerOptions as Record<string, unknown>).moduleResolution).toBe("NodeNext");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await exists.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should include standard TypeScript options", async () => {
      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = exists.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await readTsconfig();
      const opts = tsconfig.compilerOptions as Record<string, unknown>;

      expect(opts.target).toBe("ES2022");
      expect(opts.esModuleInterop).toBe(true);
      expect(opts.skipLibCheck).toBe(true);
      expect(opts.declaration).toBe(true);
      expect(tsconfig.include).toEqual(["src/**/*"]);
      expect(tsconfig.exclude).toContain("node_modules");
    });
  });

  describe("strict-enabled fix", () => {
    it("should enable strict mode", async () => {
      await createTsconfig({
        compilerOptions: {
          target: "ES2020",
        },
      });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await strictEnabled.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = strictEnabled.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify tsconfig.json was updated
      const tsconfig = await readTsconfig();
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await strictEnabled.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should preserve existing compiler options", async () => {
      await createTsconfig({
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          outDir: "build",
        },
      });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = strictEnabled.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await readTsconfig();
      const opts = tsconfig.compilerOptions as Record<string, unknown>;
      expect(opts.strict).toBe(true);
      expect(opts.target).toBe("ES2022");
      expect(opts.module).toBe("NodeNext");
      expect(opts.outDir).toBe("build");
    });
  });

  describe("no-any-enabled fix", () => {
    it("should enable noImplicitAny", async () => {
      await createTsconfig({
        compilerOptions: {
          target: "ES2020",
        },
      });

      const global = await createGlobalContext(tempDir);
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
      const tsconfig = await readTsconfig();
      expect((tsconfig.compilerOptions as Record<string, unknown>).noImplicitAny).toBe(true);

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await noAnyEnabled.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });
  });

  describe("has-outdir fix", () => {
    it("should set outDir to dist", async () => {
      await createTsconfig({
        compilerOptions: {
          strict: true,
        },
      });

      const global = await createGlobalContext(tempDir);
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
      const tsconfig = await readTsconfig();
      expect((tsconfig.compilerOptions as Record<string, unknown>).outDir).toBe("dist");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasOutdir.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });
  });

  describe("paths-valid fix", () => {
    it("should add baseUrl when paths exist", async () => {
      await createTsconfig({
        compilerOptions: {
          paths: {
            "@/*": ["src/*"],
          },
        },
      });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await pathsValid.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = pathsValid.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify tsconfig.json was updated
      const tsconfig = await readTsconfig();
      expect((tsconfig.compilerOptions as Record<string, unknown>).baseUrl).toBe(".");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await pathsValid.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should preserve existing paths", async () => {
      await createTsconfig({
        compilerOptions: {
          paths: {
            "@/*": ["src/*"],
            "@utils/*": ["src/utils/*"],
          },
        },
      });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = pathsValid.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await readTsconfig();
      const opts = tsconfig.compilerOptions as Record<string, unknown>;
      expect(opts.baseUrl).toBe(".");
      expect((opts.paths as Record<string, string[]>)["@/*"]).toEqual(["src/*"]);
      expect((opts.paths as Record<string, string[]>)["@utils/*"]).toEqual(["src/utils/*"]);
    });
  });

  describe("fix idempotency", () => {
    it("should be safe to run strict fix twice", async () => {
      await createTsconfig({
        compilerOptions: { target: "ES2020" },
      });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = strictEnabled.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);
      await fix.run(global, ctx);

      const tsconfig = await readTsconfig();
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);
    });
  });

  describe("fix error handling", () => {
    it("should fail gracefully when tsconfig.json does not exist", async () => {
      // Don't create tsconfig.json
      const global = await createGlobalContext(tempDir);
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
      await createTsconfig({});

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = strictEnabled.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const tsconfig = await readTsconfig();
      expect(tsconfig.compilerOptions).toBeDefined();
      expect((tsconfig.compilerOptions as Record<string, unknown>).strict).toBe(true);
    });
  });
});
