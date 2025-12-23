import type { Check } from "../../../types.js";
import type { NvmrcContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "nvmrc-valid-format";

export const check: Check<NvmrcContext> = {
  name,
  description: "Check if .nvmrc has valid Node version format",
  tags: ["node", "recommended"],
  run: async (_global, { raw, version }) => {
    if (!raw) return skip(name, "No .nvmrc");
    if (!version) return fail(name, "Empty .nvmrc");

    const validPatterns = [
      /^\d+$/, // 20
      /^\d+\.\d+$/, // 20.10
      /^\d+\.\d+\.\d+$/, // 20.10.0
      /^v\d+$/, // v20
      /^v\d+\.\d+$/, // v20.10
      /^v\d+\.\d+\.\d+$/, // v20.10.0
      /^lts\/\w+$/, // lts/iron
    ];

    const isValid = validPatterns.some((p) => p.test(version));
    if (!isValid) return fail(name, `Invalid format: ${version}`);
    return pass(name, `Version: ${version}`);
  },
};
