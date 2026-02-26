import { describe, it, expect } from "vitest";
import { check as dockerfileSmallBaseImage } from "./small-base-image/check.js";
import type { GlobalContext } from "../../types.js";
import type { DockerContext } from "./context.js";

// Mock global context (not used by these checks but required by signature)
const mockGlobal = {} as GlobalContext;

describe("docker checks", () => {
  describe("dockerfileSmallBaseImage", () => {
    it("should pass for alpine-based images", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM node:22-alpine",
        baseImage: "node",
        baseImageTag: "22-alpine",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("pass");
    });

    it("should pass for slim images", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM python:3.12-slim",
        baseImage: "python",
        baseImageTag: "3.12-slim",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("pass");
    });

    it("should pass for pure alpine", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM alpine:3.19",
        baseImage: "alpine",
        baseImageTag: "3.19",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("pass");
    });

    it("should fail for ubuntu", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM ubuntu:22.04",
        baseImage: "ubuntu",
        baseImageTag: "22.04",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("fail");
      expect(result.message).toContain("large base image");
    });

    it("should fail for debian", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM debian:bookworm",
        baseImage: "debian",
        baseImageTag: "bookworm",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("fail");
    });

    it("should fail for full node image without alpine/slim", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM node:22",
        baseImage: "node",
        baseImageTag: "22",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("fail");
      expect(result.message).toContain("node:<version>-alpine");
    });

    it("should fail for full python image", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM python:3.12",
        baseImage: "python",
        baseImageTag: "3.12",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("fail");
    });

    it("should skip when no Dockerfile", async () => {
      const ctx: DockerContext = {
        dockerfile: null,
        baseImage: null,
        baseImageTag: null,
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("skip");
    });

    it("should skip when base image cannot be parsed", async () => {
      const ctx: DockerContext = {
        dockerfile: "# Empty dockerfile",
        baseImage: null,
        baseImageTag: null,
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("skip");
    });

    it("should pass for unknown images", async () => {
      const ctx: DockerContext = {
        dockerfile: "FROM mycompany/myimage:latest",
        baseImage: "mycompany/myimage",
        baseImageTag: "latest",
      };
      const result = await dockerfileSmallBaseImage.run(mockGlobal, ctx);
      expect(result.status).toBe("pass");
    });
  });
});
