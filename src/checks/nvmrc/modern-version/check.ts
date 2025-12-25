import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { NvmrcContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import {
  LTS_VERSIONS,
  CURRENT_LTS_MAJOR,
  MIN_SUPPORTED_MAJOR,
  parseMajorVersion,
} from "../constants.js";

const name = "nvmrc-modern-version";

export const check: Check<NvmrcContext> = {
  name,
  description: "Check if .nvmrc specifies a modern, supported Node version",
  tags: ["node", "recommended"],
  run: async (_global, { raw, version }) => {
    if (!raw) return skip(name, "No .nvmrc");
    if (!version) return skip(name, "Empty .nvmrc");

    const major = parseMajorVersion(version);
    if (major === null) {
      return skip(name, `Cannot parse version: ${version}`);
    }

    if (major < MIN_SUPPORTED_MAJOR) {
      return fail(
        name,
        `Node ${major} is EOL. Minimum supported: ${MIN_SUPPORTED_MAJOR}`
      );
    }

    const ltsInfo = LTS_VERSIONS.find((v) => v.major === major);
    if (ltsInfo) {
      const isLatestLts = major === CURRENT_LTS_MAJOR;
      if (isLatestLts) {
        return pass(name, `Node ${major} (${ltsInfo.codename}) - latest LTS`);
      }
      return pass(name, `Node ${major} (${ltsInfo.codename}) - LTS until ${ltsInfo.eol}`);
    }

    // Odd version numbers are not LTS
    if (major % 2 !== 0) {
      return fail(name, `Node ${major} is not an LTS version`);
    }

    return pass(name, `Node ${major}`);
  },
  fix: {
    description: `Update .nvmrc to Node ${CURRENT_LTS_MAJOR} (current LTS)`,
    run: async (global) => {
      const nvmrcPath = join(global.projectPath, ".nvmrc");
      await writeFile(nvmrcPath, `${CURRENT_LTS_MAJOR}\n`, "utf-8");
      return {
        success: true,
        message: `Updated .nvmrc to Node ${CURRENT_LTS_MAJOR}`,
      };
    },
  },
};
