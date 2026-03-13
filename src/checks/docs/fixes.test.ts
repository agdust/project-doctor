import { describe, it, expect, afterEach } from "vitest";
import { createGlobalContext } from "../../context/global.js";
import { loadContext } from "./context.js";
import { check as licenseExists } from "./license-exists/check.js";
import {
  copyFixtureToTemp,
  createEmptyTempDir,
  type TempFixture,
} from "../../test/fix-test-utils.js";

describe("docs fixes", () => {
  let tempFixture: TempFixture;

  afterEach(async () => {
    if (tempFixture) {
      await tempFixture.cleanup();
    }
  });

  describe("license-exists fix", () => {
    it("should auto-create LICENSE from package.json license field (no copyright holder)", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      // Add a license field that doesn't require copyright holder (GPL-3.0)
      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      pkg.license = "GPL-3.0";
      await tempFixture.writeJson("package.json", pkg);

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      // Verify check fails (no LICENSE file)
      const checkResult = await licenseExists.run(global, ctx);
      expect(checkResult.status).toBe("fail");

      // Run fix — should auto-create LICENSE from package.json license field
      const fix = licenseExists.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain("GPL-3.0");

      // Verify LICENSE file was created
      const licenseContent = await tempFixture.readFile("LICENSE");
      expect(licenseContent).toContain("GNU GENERAL PUBLIC LICENSE");

      // Verify check now passes
      const global2 = await createGlobalContext(tempFixture.path);
      const ctx2 = await loadContext(global2);
      const checkResult2 = await licenseExists.run(global2, ctx2);
      expect(checkResult2.status).toBe("pass");
    });

    it("should auto-create LICENSE using CC0 (alias lookup)", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      pkg.license = "CC0-1.0";
      await tempFixture.writeJson("package.json", pkg);

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = licenseExists.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(true);

      const licenseContent = await tempFixture.readFile("LICENSE");
      expect(licenseContent).toContain("CC0 1.0 Universal");
    });

    it("should fail gracefully for unknown license SPDX ID", async () => {
      tempFixture = await copyFixtureToTemp("fixable");

      const pkg = await tempFixture.readJson<Record<string, unknown>>("package.json");
      pkg.license = "Apache-2.0";
      await tempFixture.writeJson("package.json", pkg);

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const fix = licenseExists.fix;
      if (!fix || "options" in fix) throw new Error("Expected simple fix");

      const fixResult = await fix.run(global, ctx);
      expect(fixResult.success).toBe(false);
      expect(fixResult.message).toContain("Apache-2.0");
      expect(fixResult.message).toContain("choosealicense.com");
    });

    it("should have fix defined as simple fix", () => {
      const fix = licenseExists.fix;
      expect(fix).toBeDefined();
      if (!fix) throw new Error("Expected fix to be defined");
      expect("run" in fix).toBe(true);
      expect("options" in fix).toBe(false);
    });

    it("should pass for healthy project (no fix needed)", async () => {
      tempFixture = await copyFixtureToTemp("healthy");

      const global = await createGlobalContext(tempFixture.path);
      const ctx = await loadContext(global);

      const checkResult = await licenseExists.run(global, ctx);
      expect(checkResult.status).toBe("pass");
    });
  });
});
