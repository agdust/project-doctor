// LTS versions with their codenames and EOL dates
// https://nodejs.org/en/about/previous-releases
//
// TODO: These values are hardcoded and need manual updates when Node.js releases new LTS versions.
// Consider fetching from https://nodejs.org/dist/index.json or using a package like `node-releases`.
export const LTS_VERSIONS = [
  { major: 18, codename: "hydrogen", eol: "2025-04-30" },
  { major: 20, codename: "iron", eol: "2026-04-30" },
  { major: 22, codename: "jod", eol: "2027-04-30" },
] as const;

// All historical LTS codenames (for validation of lts/<codename> format)
export const ALL_LTS_CODENAMES = [
  "argon", // v4
  "boron", // v6
  "carbon", // v8
  "dubnium", // v10
  "erbium", // v12
  "fermium", // v14
  "gallium", // v16
  "hydrogen", // v18
  "iron", // v20
  "jod", // v22
] as const;

export const CURRENT_LTS_MAJOR = 22;
export const MIN_SUPPORTED_MAJOR = 18;

export function parseMajorVersion(version: string): number | null {
  // Handle lts/codename format
  const ltsMatch = /^lts\/(\w+)$/i.exec(version);
  if (ltsMatch) {
    const codename = ltsMatch[1].toLowerCase();
    const lts = LTS_VERSIONS.find((v) => v.codename === codename);
    return lts?.major ?? null;
  }

  // Handle numeric versions (with or without v prefix)
  const numMatch = /^v?(\d+)/.exec(version);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return null;
}
