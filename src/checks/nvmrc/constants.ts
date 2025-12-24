// LTS versions with their codenames and EOL dates
// https://nodejs.org/en/about/previous-releases
export const LTS_VERSIONS = [
  { major: 18, codename: "hydrogen", eol: "2025-04-30" },
  { major: 20, codename: "iron", eol: "2026-04-30" },
  { major: 22, codename: "jod", eol: "2027-04-30" },
] as const;

export const CURRENT_LTS_MAJOR = 22;
export const MIN_SUPPORTED_MAJOR = 18;

export function parseMajorVersion(version: string): number | null {
  // Handle lts/codename format
  const ltsMatch = version.match(/^lts\/(\w+)$/i);
  if (ltsMatch) {
    const codename = ltsMatch[1].toLowerCase();
    const lts = LTS_VERSIONS.find((v) => v.codename === codename);
    return lts?.major ?? null;
  }

  // Handle numeric versions (with or without v prefix)
  const numMatch = version.match(/^v?(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return null;
}
