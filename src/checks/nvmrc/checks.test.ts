import { describe, it, expect } from "vitest";
import { fixtures } from "../../test/fixtures.js";
import { loadContext } from "./context.js";
import { createGlobalContext } from "../../context/global.js";
import { exists, validFormat, modernVersion } from "./checks.js";

describe("nvmrc checks", () => {
  describe("exists", () => {
    it("should pass when .nvmrc exists", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail when .nvmrc is missing", async () => {
      const global = await createGlobalContext(fixtures.empty);
      const ctx = await loadContext(global);
      const result = await exists.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("validFormat", () => {
    it("should pass for valid version format", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await validFormat.run(global, ctx);

      expect(result.status).toBe("pass");
    });

    it("should fail for invalid version format", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await validFormat.run(global, ctx);

      expect(result.status).toBe("fail");
    });
  });

  describe("modernVersion", () => {
    it("should pass for Node 20 (LTS)", async () => {
      const global = await createGlobalContext(fixtures.healthy);
      const ctx = await loadContext(global);
      const result = await modernVersion.run(global, ctx);

      expect(result.status).toBe("pass");
      expect(result.message).toContain("20");
    });

    it("should skip for invalid version format", async () => {
      const global = await createGlobalContext(fixtures.broken);
      const ctx = await loadContext(global);
      const result = await modernVersion.run(global, ctx);

      expect(result.status).toBe("skip");
    });
  });
});
