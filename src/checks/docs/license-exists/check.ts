import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { atomicWriteFile } from "../../../utils/safe-fs.js";
import { input, select } from "@inquirer/prompts";
import { TAG } from "../../../types.js";
import type { Check, PackageJson } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";
import { copyToClipboard } from "../../../utils/clipboard.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";
import {
  licenseRegistry,
  findBySpdxId,
  CHOOSE_LICENSE_URL,
  type LicenseEntry,
} from "./registry.js";

const name = "license-exists";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LICENSES_DIR = path.join(__dirname, "licenses");

/**
 * Load a license template and replace placeholders
 */
async function loadLicense(filename: string, copyrightHolder?: string): Promise<string> {
  const content = await readFile(path.join(LICENSES_DIR, filename), "utf8");
  const year = new Date().getFullYear();
  let result = content.replaceAll("{{YEAR}}", String(year));
  if (copyrightHolder !== undefined) {
    result = result.replaceAll("{{COPYRIGHT_HOLDER}}", copyrightHolder);
  }
  return result;
}

/**
 * Create a LICENSE file from a registry entry, prompting for copyright holder if needed.
 */
async function createLicenseFile(
  global: { projectPath: string },
  entry: LicenseEntry,
): Promise<void> {
  let copyrightHolder: string | undefined;
  if (entry.requiresCopyrightHolder) {
    copyrightHolder = await input({
      message: "Copyright holder (e.g., Your Name or Company):",
    });
  }
  const licensePath = path.join(global.projectPath, "LICENSE");
  await atomicWriteFile(
    licensePath,
    await loadLicense(entry.templateFile, copyrightHolder),
    "utf8",
  );
}

/**
 * Show interactive license selection prompt and create the LICENSE file.
 * Also sets package.json license field if package.json exists and has no license.
 */
async function promptAndCreateLicense(global: {
  projectPath: string;
  files: { readJson<T>(path: string): Promise<T | null> };
}): Promise<{ success: boolean; message: string }> {
  const BROWSE_VALUE = "__browse__";

  const chosen = await select({
    message: "Choose a license:",
    choices: [
      ...licenseRegistry.map((entry) => ({
        value: entry.spdxId,
        name: entry.label,
        description: entry.description,
      })),
      {
        value: BROWSE_VALUE,
        name: "Browse licenses...",
        description: "Copy choosealicense.com URL to clipboard",
      },
    ],
  });

  if (chosen === BROWSE_VALUE) {
    const ok = await copyToClipboard(CHOOSE_LICENSE_URL);
    return {
      success: false,
      message: ok
        ? `Copied ${CHOOSE_LICENSE_URL} to clipboard - choose a license and add it manually`
        : `Visit ${CHOOSE_LICENSE_URL} to compare options, then add a LICENSE file manually`,
    };
  }

  const entry = findBySpdxId(chosen);
  if (!entry) {
    return { success: false, message: `Unknown license: ${chosen}` };
  }

  await createLicenseFile({ projectPath: global.projectPath }, entry);

  // Also set package.json license field if package.json exists and has no license
  const pkg = await global.files.readJson<PackageJson>("package.json");
  if (pkg && pkg.license === undefined) {
    const pkgData = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
    if (pkgData) {
      pkgData.license = entry.spdxId;
      await writeJson(global.projectPath, "package.json", pkgData);
    }
  }

  return { success: true, message: `Created ${entry.label} LICENSE` };
}

export const check: Check<DocsContext> = {
  name,
  description: "Check if LICENSE file exists",
  tags: [TAG.universal, TAG.required, TAG.effort.low],
  run: (_global, { license }) => {
    if (license === null) {
      return fail(name, "LICENSE file not found");
    }
    return pass(name, "LICENSE file exists");
  },
  fix: {
    description: "Create LICENSE file",
    run: async (global) => {
      // Check if package.json has a license field we can use
      const pkg = await global.files.readJson<PackageJson>("package.json");
      const spdxId = pkg?.license;

      if (spdxId !== undefined && spdxId !== "") {
        // package.json has a license — try to find a matching template
        const entry = findBySpdxId(spdxId);
        if (entry) {
          await createLicenseFile(global, entry);
          return { success: true, message: `Created ${entry.label} LICENSE` };
        }
        // No template for this license
        return {
          success: false,
          message: `No template for "${spdxId}" license. Visit ${CHOOSE_LICENSE_URL} to find the text and add a LICENSE file manually.`,
        };
      }

      // No package.json license field — show interactive prompt
      return promptAndCreateLicense(global);
    },
  },
};
