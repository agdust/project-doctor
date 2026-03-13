import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createGlobalContext } from "../../context/global.js";
import { loadContext } from "./context.js";
import {
  copyFixtureToTemp,
  createEmptyTempDir,
  type TempFixture,
} from "../../test/fix-test-utils.js";
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
  let tempFixture: TempFixture;

  afterEach(async () => {
    if (tempFixture) {
      await tempFixture.cleanup();
    }
  });

  describe("has-name fix", () => {
    it("should add name from directory name using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (fixable-project has no name)
      const checkResult = await hasName.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix
      const fix = hasName.fix;
      expect(fix).toBeDefined();
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect(pkg.name).toBeDefined();
      expect(typeof pkg.name).toBe("string");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasName.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should sanitize directory name for npm compatibility", async () => {
      tempFixture = await createEmptyTempDir("pkg-name-test");

      // Create a subdirectory with special characters
      const specialDir = path.join(tempFixture.path, "My Project Name");
      await mkdir(specialDir);
      await tempFixture.writeFile(
        "My Project Name/package.json",
        JSON.stringify({ version: "1.0.0" }),
      );

      const global = await createGlobalContext(specialDir);
      const ctx = await loadContext(global);

      const fix = hasName.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      await fix.run(global, ctx);

      const content = await tempFixture.readFile("My Project Name/package.json");
      const pkg = JSON.parse(content);
      expect(pkg.name).toBe("my-project-name");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasName.run(global, ctx);
      expect(checkResult.status).toBe("pass");
      expect(checkResult.message).toContain("healthy-project");
    });
  });

  describe("has-version fix", () => {
    it("should add version 0.0.1 using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
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
      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect(pkg.version).toBe("0.0.1");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasVersion.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasVersion.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("has-description fix (semi-auto)", () => {
    it("should fail for fixable project (missing description)", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasDescription.run(global, ctx);
      expect(checkResult.status).toBe("fail");
    });

    it("should pass for healthy project", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasDescription.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });

    it("should have fix defined", () => {
      expect(hasDescription.fix).toBeDefined();
    });
  });

  describe("has-license fix", () => {
    it("should have a simple fix with run function", () => {
      const fix = hasLicense.fix;
      expect(fix).toBeDefined();
      if (!fix) throw new Error("Expected fix to be defined");
      expect("run" in fix).toBe(true);
      expect("options" in fix).toBe(false);
    });

    it("should fail for fixable project (missing license)", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasLicense.run(global, ctx);
      expect(checkResult.status).toBe("fail");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasLicense.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });

    it("should decline to auto-fix when LICENSE file exists", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      // Create a LICENSE file but no license in package.json
      await tempFixture.writeFile("LICENSE", "Some license text");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (no license in package.json)
      const checkResult = await hasLicense.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix — should decline because LICENSE file exists
      const fix = hasLicense.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(false);
      expect(fixResult.message).toContain("SPDX");
      expect(fixResult.message).toContain("spdx.org");
    });
  });

  describe("has-engines fix", () => {
    it("should add engines.node >= 20 using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
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
      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect(pkg.engines).toBeDefined();
      expect((pkg.engines as Record<string, string>).node).toBe(">=20");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasEngines.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await hasEngines.run(global, ctx);
      expect(checkResult.status).toBe("pass");
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

    it("should add main field using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
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
      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect(pkg.main).toBe("dist/index.js");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await hasMainOrExports.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should add exports field", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = hasMainOrExports.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const exportsOption = fix.options.find((o) => o.id === "exports");
      await exportsOption!.run(global, ctx);

      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect(pkg.exports).toBeDefined();
      expect(
        ((pkg.exports as Record<string, unknown>)["."] as Record<string, unknown>).import,
      ).toBe("./dist/index.js");
    });
  });

  describe("type-module fix", () => {
    it("should set type: module using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
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
      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect(pkg.type).toBe("module");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await typeModule.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await typeModule.run(global, ctx);
      expect(checkResult.status).toBe("pass");
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

    it("should add tsc build script using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (fixable has no scripts)
      const checkResult = await scriptsBuild.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run tsc fix option
      const fix = scriptsBuild.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const tscOption = fix.options.find((o) => o.id === "tsc");
      const fixResult = await tscOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      // Verify package.json was updated
      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect((pkg.scripts as Record<string, string>).build).toBe("tsc");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await scriptsBuild.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await scriptsBuild.run(global, ctx);
      expect(checkResult.status).toBe("pass");
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

    it("should add vitest test script using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = scriptsTest.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const vitestOption = fix.options.find((o) => o.id === "vitest");
      const fixResult = await vitestOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect((pkg.scripts as Record<string, string>).test).toBe("vitest");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await scriptsTest.run(global, ctx);
      expect(checkResult.status).toBe("pass");
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

    it("should add eslint lint script using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = scriptsLint.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const eslintOption = fix.options.find((o) => o.id === "eslint");
      const fixResult = await eslintOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect((pkg.scripts as Record<string, string>).lint).toBe("eslint .");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await scriptsLint.run(global, ctx);
      expect(checkResult.status).toBe("pass");
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

    it("should add prettier format script using fixable fixture", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = scriptsFormat.fix;
      if (!fix || !("options" in fix)) throw new Error("Expected fix with options");

      const prettierOption = fix.options.find((o) => o.id === "prettier");
      const fixResult = await prettierOption!.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect((pkg.scripts as Record<string, string>).format).toBe("prettier --write .");
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await scriptsFormat.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });

  describe("fix idempotency", () => {
    it("should be safe to run version fix twice", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = hasVersion.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      // Run fix twice
      await fix.run(global, ctx);
      await fix.run(global, ctx);

      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      expect(pkg.version).toBe("0.0.1");
    });
  });

  describe("fix error handling", () => {
    it("should fail gracefully when package.json does not exist", async () => {
      tempFixture = await copyFixtureToTemp("empty");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = hasVersion.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const result = await fix.run(global, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Could not read");
    });
  });
});
