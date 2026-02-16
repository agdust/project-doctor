import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGlobalContext } from "../../context/global.js";
import { loadContext } from "./context.js";
import { check as hasName } from "./has-name/check.js";
import { check as hasVersion } from "./has-version/check.js";
import { check as hasDescription } from "./has-description/check.js";
import { check as hasLicense } from "./has-license/check.js";
import { check as hasEngines } from "./has-engines/check.js";
import { check as hasMainOrExports } from "./has-main-or-exports/check.js";
import { check as typeModule } from "./type-module/check.js";
import { check as scriptsBuild } from "./scripts-build/check.js";
import { check as scriptsTest } from "./scripts-test/check.js";
import { check as scriptsLint } from "./scripts-lint/check.js";
import { check as scriptsFormat } from "./scripts-format/check.js";

describe("package-json fixes", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pkg-json-fix-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function createPackageJson(content: Record<string, unknown>) {
    await writeFile(join(tempDir, "package.json"), JSON.stringify(content, null, 2));
  }

  async function readPackageJson(): Promise<Record<string, unknown>> {
    const content = await readFile(join(tempDir, "package.json"), "utf-8");
    return JSON.parse(content);
  }

  describe("has-name fix", () => {
    it("should add name from directory name", async () => {
      await createPackageJson({ version: "1.0.0" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await hasName.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = hasName.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await readPackageJson();
      expect(pkg.name).toBeDefined();
      expect(typeof pkg.name).toBe("string");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasName.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should sanitize directory name for npm compatibility", async () => {
      // Create a subdirectory with special characters
      const specialDir = join(tempDir, "My Project Name");
      await mkdir(specialDir);
      await writeFile(join(specialDir, "package.json"), JSON.stringify({ version: "1.0.0" }));

      const global = await createGlobalContext(specialDir);
      const ctx = await loadContext(global);

      const fix = hasName.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await readFile(join(specialDir, "package.json"), "utf-8");
      const pkg = JSON.parse(content);
      expect(pkg.name).toBe("my-project-name");
    });
  });

  describe("has-version fix", () => {
    it("should add version 0.0.1", async () => {
      await createPackageJson({ name: "test" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await hasVersion.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = hasVersion.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain("0.0.1");

      // Verify package.json was updated
      const pkg = await readPackageJson();
      expect(pkg.version).toBe("0.0.1");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasVersion.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });
  });

  describe("has-description fix (semi-auto)", () => {
    it("should have fix defined", () => {
      expect(hasDescription.fix).toBeDefined();
    });

    // Note: Full test would require mocking @inquirer/prompts
    // The fix prompts for user input which can't be easily tested without mocks
  });

  describe("has-license fix", () => {
    it("should have multiple license options", () => {
      const fix = hasLicense.fix;
      expect(fix).toBeDefined();
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      expect(fix.options.length).toBeGreaterThanOrEqual(4);
      expect(fix.options.map((o) => o.id)).toContain("mit");
      expect(fix.options.map((o) => o.id)).toContain("apache");
      expect(fix.options.map((o) => o.id)).toContain("isc");
      expect(fix.options.map((o) => o.id)).toContain("gpl3");
    });

    it("should add MIT license", async () => {
      await createPackageJson({ name: "test", version: "1.0.0" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await hasLicense.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run MIT fix option
      const fix = hasLicense.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const mitOption = fix.options.find((o) => o.id === "mit");
      expect(mitOption).toBeDefined();

      const fixResult = await mitOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await readPackageJson();
      expect(pkg.license).toBe("MIT");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasLicense.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should add Apache-2.0 license", async () => {
      await createPackageJson({ name: "test", version: "1.0.0" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = hasLicense.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const apacheOption = fix.options.find((o) => o.id === "apache");
      await apacheOption!.run(global, ctx);

      const pkg = await readPackageJson();
      expect(pkg.license).toBe("Apache-2.0");
    });
  });

  describe("has-engines fix", () => {
    it("should add engines.node >= 20", async () => {
      await createPackageJson({ name: "test", version: "1.0.0" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await hasEngines.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = hasEngines.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await readPackageJson();
      expect(pkg.engines).toBeDefined();
      expect((pkg.engines as Record<string, string>).node).toBe(">=20");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasEngines.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should preserve existing engines fields", async () => {
      await createPackageJson({
        name: "test",
        version: "1.0.0",
        engines: { npm: ">=9" },
      });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = hasEngines.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const pkg = await readPackageJson();
      const engines = pkg.engines as Record<string, string>;
      expect(engines.node).toBe(">=20");
      expect(engines.npm).toBe(">=9");
    });
  });

  describe("has-main-or-exports fix", () => {
    it("should have main and exports options", () => {
      const fix = hasMainOrExports.fix;
      expect(fix).toBeDefined();
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      expect(fix.options.length).toBe(2);
      expect(fix.options.map((o) => o.id)).toContain("main");
      expect(fix.options.map((o) => o.id)).toContain("exports");
    });

    it("should add main field", async () => {
      await createPackageJson({ name: "test", version: "1.0.0" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await hasMainOrExports.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run main fix option
      const fix = hasMainOrExports.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const mainOption = fix.options.find((o) => o.id === "main");
      const fixResult = await mainOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await readPackageJson();
      expect(pkg.main).toBe("dist/index.js");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasMainOrExports.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should add exports field", async () => {
      await createPackageJson({ name: "test", version: "1.0.0" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = hasMainOrExports.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const exportsOption = fix.options.find((o) => o.id === "exports");
      await exportsOption!.run(global, ctx);

      const pkg = await readPackageJson();
      expect(pkg.exports).toBeDefined();
      expect((pkg.exports as Record<string, unknown>)["."].import).toBe("./dist/index.js");
    });
  });

  describe("type-module fix", () => {
    it("should set type: module", async () => {
      await createPackageJson({ name: "test", version: "1.0.0" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await typeModule.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = typeModule.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await readPackageJson();
      expect(pkg.type).toBe("module");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await typeModule.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });
  });

  describe("scripts-build fix", () => {
    it("should have build script options", () => {
      const fix = scriptsBuild.fix;
      expect(fix).toBeDefined();
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      expect(fix.options.map((o) => o.id)).toContain("tsc");
      expect(fix.options.map((o) => o.id)).toContain("tsup");
      expect(fix.options.map((o) => o.id)).toContain("vite");
    });

    it("should add tsc build script", async () => {
      await createPackageJson({ name: "test", version: "1.0.0", scripts: {} });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      // Verify check fails
      const checkResult = await scriptsBuild.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run tsc fix option
      const fix = scriptsBuild.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const tscOption = fix.options.find((o) => o.id === "tsc");
      const fixResult = await tscOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await readPackageJson();
      expect((pkg.scripts as Record<string, string>).build).toBe("tsc");

      // Verify check now passes
      const global2 = await createGlobalContext(tempDir);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await scriptsBuild.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should add tsup build script", async () => {
      await createPackageJson({ name: "test", version: "1.0.0", scripts: {} });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = scriptsBuild.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const tsupOption = fix.options.find((o) => o.id === "tsup");
      await tsupOption!.run(global, ctx);

      const pkg = await readPackageJson();
      expect((pkg.scripts as Record<string, string>).build).toBe("tsup");
    });
  });

  describe("scripts-test fix", () => {
    it("should have test script options", () => {
      const fix = scriptsTest.fix;
      expect(fix).toBeDefined();
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      expect(fix.options.map((o) => o.id)).toContain("vitest");
      expect(fix.options.map((o) => o.id)).toContain("jest");
      expect(fix.options.map((o) => o.id)).toContain("node-test");
    });

    it("should add vitest test script", async () => {
      await createPackageJson({ name: "test", version: "1.0.0", scripts: {} });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = scriptsTest.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const vitestOption = fix.options.find((o) => o.id === "vitest");
      const fixResult = await vitestOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const pkg = await readPackageJson();
      expect((pkg.scripts as Record<string, string>).test).toBe("vitest");
    });

    it("should add node --test script", async () => {
      await createPackageJson({ name: "test", version: "1.0.0", scripts: {} });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = scriptsTest.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const nodeTestOption = fix.options.find((o) => o.id === "node-test");
      await nodeTestOption!.run(global, ctx);

      const pkg = await readPackageJson();
      expect((pkg.scripts as Record<string, string>).test).toBe("node --test");
    });
  });

  describe("scripts-lint fix", () => {
    it("should have lint script options", () => {
      const fix = scriptsLint.fix;
      expect(fix).toBeDefined();
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      expect(fix.options.map((o) => o.id)).toContain("eslint");
      expect(fix.options.map((o) => o.id)).toContain("biome");
      expect(fix.options.map((o) => o.id)).toContain("tsc");
    });

    it("should add eslint lint script", async () => {
      await createPackageJson({ name: "test", version: "1.0.0", scripts: {} });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = scriptsLint.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const eslintOption = fix.options.find((o) => o.id === "eslint");
      const fixResult = await eslintOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const pkg = await readPackageJson();
      expect((pkg.scripts as Record<string, string>).lint).toBe("eslint .");
    });
  });

  describe("scripts-format fix", () => {
    it("should have format script options", () => {
      const fix = scriptsFormat.fix;
      expect(fix).toBeDefined();
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      expect(fix.options.map((o) => o.id)).toContain("prettier");
      expect(fix.options.map((o) => o.id)).toContain("biome");
      expect(fix.options.map((o) => o.id)).toContain("dprint");
    });

    it("should add prettier format script", async () => {
      await createPackageJson({ name: "test", version: "1.0.0", scripts: {} });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = scriptsFormat.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const prettierOption = fix.options.find((o) => o.id === "prettier");
      const fixResult = await prettierOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const pkg = await readPackageJson();
      expect((pkg.scripts as Record<string, string>).format).toBe("prettier --write .");
    });
  });

  describe("fix idempotency", () => {
    it("should be safe to run version fix twice", async () => {
      await createPackageJson({ name: "test" });

      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = hasVersion.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);
      await fix.run(global, ctx);

      const pkg = await readPackageJson();
      expect(pkg.version).toBe("0.0.1");
    });
  });

  describe("fix error handling", () => {
    it("should fail gracefully when package.json does not exist", async () => {
      // Don't create package.json
      const global = await createGlobalContext(tempDir);
      const ctx = await loadContext(global);

      const fix = hasVersion.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const result = await fix.run(global, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Could not read");
    });
  });
});
