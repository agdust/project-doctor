import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  loadConfig,
  loadAndResolveConfig,
  setProjectType,
  updateConfig,
  resolveConfig,
  detectProjectTypeWithCause,
} from "./loader.js";

describe("config loader", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "project-doctor-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("setProjectType", () => {
    it("should write projectType to config file", async () => {
      await setProjectType(tempDir, "generic");

      const config = await loadConfig(tempDir);
      expect(config).not.toBeNull();
      expect(config?.projectType).toBe("generic");
    });

    it("should preserve existing config when setting projectType", async () => {
      // Write initial config with some checks disabled
      await updateConfig(tempDir, {
        checks: { "some-check": "off" },
      });

      // Now set project type
      await setProjectType(tempDir, "generic");

      const config = await loadConfig(tempDir);
      expect(config?.projectType).toBe("generic");
      expect(config?.checks?.["some-check"]).toBe("off");
    });
  });

  describe("loadAndResolveConfig", () => {
    it("should return projectType from config with source 'config'", async () => {
      // Set up a JS project (has package.json which would auto-detect as "js")
      await writeFile(path.join(tempDir, "package.json"), '{"name": "test"}');

      // But explicitly set project type to "generic" in config
      await setProjectType(tempDir, "generic");

      // Load and resolve should use the config setting
      const resolved = await loadAndResolveConfig(tempDir);
      expect(resolved.projectType).toBe("generic");
      expect(resolved.projectTypeSource).toBe("config");
      expect(resolved.projectTypeDetectedFrom).toBeUndefined();
    });

    it("should auto-detect projectType when not in config", async () => {
      // Set up a JS project without explicit config
      await writeFile(path.join(tempDir, "package.json"), '{"name": "test"}');

      const resolved = await loadAndResolveConfig(tempDir);
      expect(resolved.projectType).toBe("js");
      expect(resolved.projectTypeSource).toBe("detected");
      expect(resolved.projectTypeDetectedFrom).toBe("package.json");
    });

    it("should detect generic type when no JS indicators present", async () => {
      // Empty project with no JS files
      const resolved = await loadAndResolveConfig(tempDir);
      expect(resolved.projectType).toBe("generic");
      expect(resolved.projectTypeSource).toBe("detected");
      expect(resolved.projectTypeDetectedFrom).toBe("fallback");
    });
  });

  describe("resolveConfig", () => {
    it("should use config projectType over detected when config has it", () => {
      const config = { projectType: "generic" as const };
      const detection = {
        type: "js" as const,
        source: "detected" as const,
        detectedFrom: "package.json",
      };

      const resolved = resolveConfig(config, detection);
      expect(resolved.projectType).toBe("generic");
      expect(resolved.projectTypeSource).toBe("config");
      expect(resolved.projectTypeDetectedFrom).toBeUndefined();
    });

    it("should use detected projectType when config does not have it", () => {
      const config = { checks: { "some-check": "off" as const } };
      const detection = {
        type: "js" as const,
        source: "detected" as const,
        detectedFrom: "tsconfig.json",
      };

      const resolved = resolveConfig(config, detection);
      expect(resolved.projectType).toBe("js");
      expect(resolved.projectTypeSource).toBe("detected");
      expect(resolved.projectTypeDetectedFrom).toBe("tsconfig.json");
    });
  });

  describe("detectProjectTypeWithCause", () => {
    it("should detect JS project from package.json", async () => {
      await writeFile(path.join(tempDir, "package.json"), "{}");

      const result = await detectProjectTypeWithCause(tempDir);
      expect(result.type).toBe("js");
      expect(result.source).toBe("detected");
      expect(result.detectedFrom).toBe("package.json");
    });

    it("should detect JS project from tsconfig.json", async () => {
      await writeFile(path.join(tempDir, "tsconfig.json"), "{}");

      const result = await detectProjectTypeWithCause(tempDir);
      expect(result.type).toBe("js");
      expect(result.source).toBe("detected");
      expect(result.detectedFrom).toBe("tsconfig.json");
    });

    it("should return generic with fallback when no JS indicators", async () => {
      const result = await detectProjectTypeWithCause(tempDir);
      expect(result.type).toBe("generic");
      expect(result.source).toBe("detected");
      expect(result.detectedFrom).toBe("fallback");
    });
  });

  describe("config persistence flow (end-to-end)", () => {
    it("should persist projectType selection across load cycles", async () => {
      // Simulate a JS project
      await writeFile(path.join(tempDir, "package.json"), '{"name": "test-app"}');

      // Initial load should auto-detect as JS
      let resolved = await loadAndResolveConfig(tempDir);
      expect(resolved.projectType).toBe("js");
      expect(resolved.projectTypeSource).toBe("detected");

      // User selects "generic" in the UI
      await setProjectType(tempDir, "generic");

      // After reload, should read from config as "generic"
      resolved = await loadAndResolveConfig(tempDir);
      expect(resolved.projectType).toBe("generic");
      expect(resolved.projectTypeSource).toBe("config");

      // User changes back to "js"
      await setProjectType(tempDir, "js");

      // After reload, should read from config as "js"
      resolved = await loadAndResolveConfig(tempDir);
      expect(resolved.projectType).toBe("js");
      expect(resolved.projectTypeSource).toBe("config");
    });
  });
});
