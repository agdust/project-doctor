import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";

const name = "package-json-has-license";

async function setLicense(projectPath: string, license: string) {
  const pkg = await readJson<Record<string, unknown>>(projectPath, "package.json");
  if (!pkg) return { success: false, message: "Could not read package.json" };

  pkg.license = license;
  await writeJson(projectPath, "package.json", pkg);
  return { success: true, message: `Added license: ${license}` };
}

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has license field",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.license) return fail(name, "Missing license field");
    return pass(name, `License: ${parsed.license}`);
  },
  fix: {
    description: "Add license field",
    options: [
      {
        id: "mit",
        label: "MIT",
        description: "Permissive license, allows forks to be closed source",
        run: async (global) => setLicense(global.projectPath, "MIT"),
      },
      {
        id: "apache",
        label: "Apache-2.0",
        description: "Permissive license with patent protection",
        run: async (global) => setLicense(global.projectPath, "Apache-2.0"),
      },
      {
        id: "isc",
        label: "ISC",
        description: "Simplified permissive license (similar to MIT)",
        run: async (global) => setLicense(global.projectPath, "ISC"),
      },
      {
        id: "gpl3",
        label: "GPL-3.0",
        description: "Copyleft license, requires derivative works to be open source",
        run: async (global) => setLicense(global.projectPath, "GPL-3.0"),
      },
    ],
  },
};
