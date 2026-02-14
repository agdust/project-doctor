import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";
import { openBrowser } from "../../../utils/open-browser.js";

const name = "license-exists";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LICENSES_DIR = join(__dirname, "licenses");

/**
 * Load a license template and replace {{YEAR}} with current year
 */
async function loadLicense(filename: string): Promise<string> {
  const content = await readFile(join(LICENSES_DIR, filename), "utf-8");
  const year = new Date().getFullYear();
  return content.replace(/\{\{YEAR\}\}/g, String(year));
}

export const check: Check<DocsContext> = {
  name,
  description: "Check if LICENSE file exists",
  tags: ["universal", "required", "effort:low"],
  run: async (_global, { license }) => {
    if (!license) return fail(name, "LICENSE file not found");
    return pass(name, "LICENSE file exists");
  },
  fix: {
    description: "Create LICENSE file",
    options: [
      {
        id: "mit",
        label: "MIT License",
        description: "Permissive license, allows forks to be closed source",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, await loadLicense("mit.txt"), "utf-8");
          return { success: true, message: "Created MIT LICENSE" };
        },
      },
      {
        id: "gpl3",
        label: "GPL-3.0 License",
        description: "Copyleft license, requires derivative works to be open source",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, await loadLicense("gpl3.txt"), "utf-8");
          return { success: true, message: "Created GPL-3.0 LICENSE" };
        },
      },
      {
        id: "cc0",
        label: "CC0 (Public Domain)",
        description: "Dedicate to public domain, no restrictions",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, await loadLicense("cc0.txt"), "utf-8");
          return { success: true, message: "Created CC0 LICENSE" };
        },
      },
      {
        id: "proprietary",
        label: "Proprietary",
        description: "All rights reserved, for internal/private projects",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, await loadLicense("proprietary.txt"), "utf-8");
          return { success: true, message: "Created PROPRIETARY LICENSE" };
        },
      },
      {
        id: "browse",
        label: "Browse licenses...",
        description: "Open choosealicense.com to compare options",
        run: async () => {
          await openBrowser("https://choosealicense.com/");
          return { success: false, message: "Opened browser - choose a license and add it manually" };
        },
      },
    ],
  },
};
