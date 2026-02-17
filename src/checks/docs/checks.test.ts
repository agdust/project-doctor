import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { check as readmeExists } from "./readme-exists/check.js";
import { check as licenseExists } from "./license-exists/check.js";
import { check as changelogExists } from "./changelog-exists/check.js";

describe("docs checks", () => {
  describe("context loading", () => {
    it("should load all doc files", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);

      expect(ctx.readme).not.toBeNull();
      expect(ctx.license).not.toBeNull();
      expect(ctx.changelog).not.toBeNull();
    });

    it("should return nulls for missing files", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);

      expect(ctx.readme).toBeNull();
      expect(ctx.license).toBeNull();
      expect(ctx.changelog).toBeNull();
    });
  });

  describe("readmeExists", () => {
    it("should pass when README.md exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await readmeExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when README.md is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await readmeExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("licenseExists", () => {
    it("should pass when LICENSE exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await licenseExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when LICENSE is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await licenseExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("changelogExists", () => {
    it("should pass when CHANGELOG.md exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await changelogExists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when CHANGELOG.md is missing", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await changelogExists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });
});
