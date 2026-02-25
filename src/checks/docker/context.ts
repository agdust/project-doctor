import type { GlobalContext } from "../../types.js";

export interface DockerContext {
  dockerfile: string | null;
  baseImage: string | null;
  /** The tag, or null if no tag specified (implies :latest) or using digest */
  baseImageTag: string | null;
}

/**
 * Parse the FROM instruction from a Dockerfile.
 *
 * Handles various FROM formats:
 * - FROM image
 * - FROM image:tag
 * - FROM image:tag AS stage
 * - FROM image@digest
 * - FROM --platform=linux/amd64 image:tag
 */
function parseFromInstruction(dockerfile: string): { image: string; tag: string | null } | null {
  const lines = dockerfile.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.toUpperCase().startsWith("FROM ")) {
      let fromPart = trimmed.slice(5).trim();

      // Skip --platform and other flags (e.g., --platform=linux/amd64)
      while (fromPart.startsWith("--")) {
        const spaceIndex = fromPart.indexOf(" ");
        if (spaceIndex === -1) {
          return null;
        }
        fromPart = fromPart.slice(spaceIndex + 1).trim();
      }

      // Get the image reference (before any AS alias or whitespace)
      const imageRef = fromPart.split(/\s+/)[0];
      if (!imageRef) {
        return null;
      }

      // Handle digest references (image@sha256:...)
      if (imageRef.includes("@")) {
        const [image] = imageRef.split("@");
        return { image, tag: null };
      }

      // Handle tag references (image:tag)
      const colonIndex = imageRef.lastIndexOf(":");
      if (colonIndex !== -1) {
        const image = imageRef.slice(0, colonIndex);
        const tag = imageRef.slice(colonIndex + 1);
        return { image, tag };
      }

      // No tag specified
      return { image: imageRef, tag: null };
    }
  }
  return null;
}

export async function loadContext(global: GlobalContext): Promise<DockerContext> {
  const dockerfile = await global.files.readText("Dockerfile");

  let baseImage: string | null = null;
  let baseImageTag: string | null = null;

  if (dockerfile !== null) {
    const parsed = parseFromInstruction(dockerfile);
    if (parsed) {
      baseImage = parsed.image;
      baseImageTag = parsed.tag;
    }
  }

  return { dockerfile, baseImage, baseImageTag };
}
