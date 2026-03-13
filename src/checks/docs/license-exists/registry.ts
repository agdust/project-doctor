export interface LicenseEntry {
  spdxId: string;
  spdxAliases?: string[];
  templateFile: string;
  label: string;
  description: string;
  requiresCopyrightHolder: boolean;
}

export const licenseRegistry: LicenseEntry[] = [
  {
    spdxId: "MIT",
    templateFile: "mit.txt",
    label: "MIT License",
    description: "Permissive license, allows forks to be closed source",
    requiresCopyrightHolder: true,
  },
  {
    spdxId: "GPL-3.0-or-later",
    spdxAliases: ["GPL-3.0", "GPL-3.0-only"],
    templateFile: "gpl3.txt",
    label: "GPL-3.0 License",
    description: "Copyleft license, requires derivative works to be open source",
    requiresCopyrightHolder: false,
  },
  {
    spdxId: "CC0-1.0",
    spdxAliases: ["CC0"],
    templateFile: "cc0.txt",
    label: "CC0 (Public Domain)",
    description: "Dedicate to public domain, no restrictions",
    requiresCopyrightHolder: false,
  },
  {
    spdxId: "UNLICENSED",
    templateFile: "proprietary.txt",
    label: "Proprietary",
    description: "All rights reserved, for internal/private projects",
    requiresCopyrightHolder: true,
  },
];

/**
 * Find a license entry by SPDX identifier (case-insensitive, supports aliases).
 */
export function findBySpdxId(id: string): LicenseEntry | undefined {
  const lower = id.toLowerCase();
  return licenseRegistry.find(
    (entry) =>
      entry.spdxId.toLowerCase() === lower ||
      (entry.spdxAliases?.some((alias) => alias.toLowerCase() === lower) ?? false),
  );
}

export const CHOOSE_LICENSE_URL = "https://choosealicense.com/";
export const SPDX_LICENSE_URL = "https://spdx.org/licenses/";
