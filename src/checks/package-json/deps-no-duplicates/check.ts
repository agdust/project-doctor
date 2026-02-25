import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-deps-no-duplicates";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check that no package is in both dependencies and devDependencies",
  tags: ["node", "recommended", "effort:medium"],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No package.json");
    }
    const deps = Object.keys(parsed.dependencies ?? {});
    const devDeps = Object.keys(parsed.devDependencies ?? {});
    const duplicates = deps.filter((d) => devDeps.includes(d));
    if (duplicates.length > 0) {
      return fail(name, `Duplicates: ${duplicates.join(", ")}`);
    }
    return pass(name, "No duplicates");
  },
};
