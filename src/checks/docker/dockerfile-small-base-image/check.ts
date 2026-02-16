import type { Check } from "../../../types.js";
import type { DockerContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "dockerfile-small-base-image";

/**
 * Large base images that should be avoided
 * These are typically 100MB+ and include unnecessary packages
 */
const LARGE_BASE_IMAGES = new Set([
  "ubuntu",
  "debian",
  "centos",
  "fedora",
  "amazonlinux",
  "oraclelinux",
  "rockylinux",
  "almalinux",
]);

/**
 * Images that have smaller variants available
 * Map of image name to recommended alternative
 */
const HAS_SMALLER_VARIANT: Record<string, string> = {
  node: "node:<version>-alpine",
  python: "python:<version>-slim or python:<version>-alpine",
  ruby: "ruby:<version>-slim or ruby:<version>-alpine",
  golang: "golang:<version>-alpine",
  rust: "rust:<version>-slim or rust:<version>-alpine",
  php: "php:<version>-alpine",
  openjdk: "eclipse-temurin:<version>-alpine",
  java: "eclipse-temurin:<version>-alpine",
};

/**
 * Tags that indicate a small image variant
 */
function isSmallVariant(tag: string): boolean {
  const lowerTag = tag.toLowerCase();
  return (
    lowerTag.includes("alpine") ||
    lowerTag.includes("slim") ||
    lowerTag.includes("distroless") ||
    lowerTag.includes("scratch")
  );
}

export const check: Check<DockerContext> = {
  name,
  description: "Check if Dockerfile uses a small base image",
  tags: ["universal", "recommended", "effort:medium"],
  run: async (_global, { dockerfile, baseImage, baseImageTag }) => {
    if (!dockerfile) return skip(name, "No Dockerfile");
    if (!baseImage) return skip(name, "Could not parse base image");

    const imageName = baseImage.toLowerCase();
    const tag = baseImageTag?.toLowerCase() ?? "latest";

    // Check if using a known large base image
    if (LARGE_BASE_IMAGES.has(imageName)) {
      return fail(
        name,
        `Using large base image '${baseImage}' (~100MB+). Consider alpine (~5MB) or a language-specific slim image`,
      );
    }

    // Check if using a language image without slim/alpine variant
    if (imageName in HAS_SMALLER_VARIANT && !isSmallVariant(tag)) {
      return fail(
        name,
        `Using full '${baseImage}:${baseImageTag}' image. Consider ${HAS_SMALLER_VARIANT[imageName]}`,
      );
    }

    // Check for explicitly small images
    if (
      imageName === "alpine" ||
      imageName === "scratch" ||
      imageName.includes("distroless") ||
      isSmallVariant(tag)
    ) {
      return pass(name, `Using small base image: ${baseImage}:${baseImageTag ?? "latest"}`);
    }

    // Unknown image, pass with note
    return pass(name, `Base image: ${baseImage}:${baseImageTag ?? "latest"}`);
  },
};
