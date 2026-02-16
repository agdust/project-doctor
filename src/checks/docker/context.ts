import type { GlobalContext } from "../../types.js";

export interface DockerContext {
  dockerfile: string | null;
  baseImage: string | null;
  baseImageTag: string | null;
}

/**
 * Parse the FROM instruction from a Dockerfile
 */
function parseFromInstruction(dockerfile: string): { image: string; tag: string } | null {
  const lines = dockerfile.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase().startsWith("FROM ")) {
      const fromPart = trimmed.slice(5).trim();
      // Handle "FROM image:tag AS stage" or "FROM image:tag"
      const imageWithTag = fromPart.split(/\s+/)[0];
      const [image, tag] = imageWithTag.split(":");
      return { image, tag };
    }
  }
  return null;
}

export async function loadContext(global: GlobalContext): Promise<DockerContext> {
  const dockerfile = await global.files.readText("Dockerfile");

  let baseImage: string | null = null;
  let baseImageTag: string | null = null;

  if (dockerfile) {
    const parsed = parseFromInstruction(dockerfile);
    if (parsed) {
      baseImage = parsed.image;
      baseImageTag = parsed.tag;
    }
  }

  return { dockerfile, baseImage, baseImageTag };
}
