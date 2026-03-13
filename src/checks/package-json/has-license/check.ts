import { TAG, type Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";
import { select } from "@inquirer/prompts";
import { copyToClipboard } from "../../../utils/clipboard.js";
import { licenseRegistry, SPDX_LICENSE_URL } from "../../docs/license-exists/registry.js";

const name = "package-json-has-license";

async function setLicense(projectPath: string, license: string) {
  const pkg = await readJson<Record<string, unknown>>(projectPath, "package.json");
  if (!pkg) {
    return { success: false, message: "Could not read package.json" };
  }

  pkg.license = license;
  await writeJson(projectPath, "package.json", pkg);
  return { success: true, message: `Added license: ${license}` };
}

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has license field",
  tags: [TAG.node, TAG.recommended, TAG.effort.low],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No package.json");
    }
    if (parsed.license === undefined) {
      return fail(name, "Missing license field");
    }
    return pass(name, `License: ${parsed.license}`);
  },
  fix: {
    description: "Add license field",
    run: async (global) => {
      // Check if LICENSE file exists — if so, user should pick the SPDX id manually
      const licenseFile = await global.files.readText("LICENSE");
      if (licenseFile !== null) {
        return {
          success: false,
          message: `Pick a SPDX identifier matching your LICENSE file. See ${SPDX_LICENSE_URL} for the full list.`,
        };
      }

      // No LICENSE file — show interactive prompt
      const BROWSE_VALUE = "__browse__";

      const chosen = await select({
        message: "Choose a license SPDX identifier:",
        choices: [
          ...licenseRegistry.map((entry) => ({
            value: entry.spdxId,
            name: entry.spdxId,
            description: entry.description,
          })),
          {
            value: BROWSE_VALUE,
            name: "Browse licenses...",
            description: "Copy spdx.org/licenses URL to clipboard",
          },
        ],
      });

      if (chosen === BROWSE_VALUE) {
        const ok = await copyToClipboard(SPDX_LICENSE_URL);
        return {
          success: false,
          message: ok
            ? `Copied ${SPDX_LICENSE_URL} to clipboard - find the SPDX identifier for your license`
            : `Visit ${SPDX_LICENSE_URL} to find the SPDX identifier for your license`,
        };
      }

      return setLicense(global.projectPath, chosen);
    },
  },
};
