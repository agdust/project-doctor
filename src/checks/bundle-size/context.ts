import type { GlobalContext } from "../../types.js";

interface PackageJson {
  "size-limit"?: unknown[];
  scripts?: Record<string, string>;
}

export interface BundleSizeContext {
  hasSizeLimitConfig: boolean;
  hasSizeLimitScript: boolean;
  configLocation: "file" | "package" | null;
}

export async function loadContext(global: GlobalContext): Promise<BundleSizeContext> {
  const [packageJson, hasSizeLimitFile] = await Promise.all([
    global.files.readJson<PackageJson>("package.json"),
    global.files.exists(".size-limit.json"),
  ]);

  const hasConfigInPackage = Boolean(packageJson?.["size-limit"]);
  const hasSizeLimitConfig = hasSizeLimitFile || hasConfigInPackage;

  let configLocation: "file" | "package" | null = null;
  if (hasSizeLimitFile) {
    configLocation = "file";
  } else if (hasConfigInPackage) {
    configLocation = "package";
  }

  const scripts = packageJson?.scripts ?? {};
  const hasSizeLimitScript = Object.values(scripts).some((script) => script.includes("size-limit"));

  return {
    hasSizeLimitConfig,
    hasSizeLimitScript,
    configLocation,
  };
}
