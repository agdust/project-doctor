import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { NpmContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import {
  LTS_VERSIONS,
  CURRENT_LTS_MAJOR,
  MIN_SUPPORTED_MAJOR,
  parseMajorVersion,
} from "../constants.js";

const name = "npm-nvmrc-modern-version";

export const check: Check<NpmContext> = {
  name,
  description: "Check if .nvmrc specifies a modern, supported Node version",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, { nvmrc }) => {
    if (!nvmrc.raw) return skip(name, "No .nvmrc");
    if (!nvmrc.version) return skip(name, "Empty .nvmrc");

    const major = parseMajorVersion(nvmrc.version);
    if (major === null) {
      return skip(name, `Cannot parse version: ${nvmrc.version}`);
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
