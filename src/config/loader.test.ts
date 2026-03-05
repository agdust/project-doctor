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
  isCheckOff,
  isTagOff,
  isGroupOff,
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

  describe("malformed config handling", () => {
    it("should return null for malformed JSON config", async () => {
      const configDir = path.join(tempDir, ".project-doctor");
      await mkdir(configDir, { recursive: true });
      await writeFile(path.join(configDir, "config.json"), "not-valid-json{{{");

      const config = await loadConfig(tempDir);
      expect(config).toBeNull();
    });

    it("should return null for malformed JSON5 config", async () => {
      const configDir = path.join(tempDir, ".project-doctor");
      await mkdir(configDir, { recursive: true });
      await writeFile(path.join(configDir, "config.json5"), "{{invalid json5");

      const config = await loadConfig(tempDir);
      expect(config).toBeNull();
    });

    it("should use defaults when config file is malformed", async () => {
      const configDir = path.join(tempDir, ".project-doctor");
      await mkdir(configDir, { recursive: true });
      await writeFile(path.join(configDir, "config.json5"), "invalid content");

      const resolved = await loadAndResolveConfig(tempDir);
      expect(resolved.checks).toEqual({});
      expect(resolved.tags).toEqual({});
      expect(resolved.groups).toEqual({});
    });
  });

  describe("isCheckOff / isTagOff / isGroupOff helpers", () => {
    it("isCheckOff should return true for off checks and false otherwise", async () => {
      await updateConfig(tempDir, {
        checks: { "disabled-check": "off", "enabled-check": "error" },
      });
      const resolved = await loadAndResolveConfig(tempDir);

      expect(isCheckOff(resolved, "disabled-check")).toBe(true);
      expect(isCheckOff(resolved, "enabled-check")).toBe(false);
      expect(isCheckOff(resolved, "unconfigured-check")).toBe(false);
    });

    it("isTagOff should return true for off tags and false otherwise", async () => {
      await updateConfig(tempDir, { tags: { opinionated: "off" } });
      const resolved = await loadAndResolveConfig(tempDir);

      expect(isTagOff(resolved, "opinionated")).toBe(true);
      expect(isTagOff(resolved, "required")).toBe(false);
    });

    it("isGroupOff should return true for off groups and false otherwise", async () => {
      await updateConfig(tempDir, { groups: { eslint: "off" } });
      const resolved = await loadAndResolveConfig(tempDir);

      expect(isGroupOff(resolved, "eslint")).toBe(true);
      expect(isGroupOff(resolved, "docs")).toBe(false);
    });
  });

  describe("config with all field types", () => {
    it("should persist checks, tags, and groups simultaneously", async () => {
      await updateConfig(tempDir, {
        checks: { "some-check": "off" },
        tags: { opinionated: "off" },
        groups: { eslint: "off" },
      });

      const config = await loadConfig(tempDir);
      expect(config).not.toBeNull();
      expect(config!.checks?.["some-check"]).toBe("off");
      expect(config!.tags?.["opinionated"]).toBe("off");
      expect(config!.groups?.["eslint"]).toBe("off");
    });
  });

  describe("skip-until config entries", () => {
    it("should persist skip-until values", async () => {
      await updateConfig(tempDir, {
        checks: { "some-check": "skip-until-2025-06-01" },
      });

      const config = await loadConfig(tempDir);
      expect(config?.checks?.["some-check"]).toBe("skip-until-2025-06-01");
    });

    it("isCheckOff should treat active skip-until as off (muted)", async () => {
      // Use a date in the near future (within the 3-year max window)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = futureDate.toISOString().split("T")[0];

      await updateConfig(tempDir, {
        checks: { "muted-check": `skip-until-${dateStr}` },
      });
      const resolved = await loadAndResolveConfig(tempDir);

      // Active skip-until is treated as "off" by isSeverityOff
      expect(isCheckOff(resolved, "muted-check")).toBe(true);
    });

    it("isCheckOff should treat expired skip-until as not off", async () => {
      await updateConfig(tempDir, {
        checks: { "expired-check": "skip-until-2020-01-01" },
      });
      const resolved = await loadAndResolveConfig(tempDir);

      // Expired skip-until should NOT be treated as off — check re-enables
      expect(isCheckOff(resolved, "expired-check")).toBe(false);
    });
  });
});
