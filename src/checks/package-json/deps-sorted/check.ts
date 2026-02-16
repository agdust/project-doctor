import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-deps-sorted";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if dependencies are sorted alphabetically",
  tags: ["node", "opinionated", "effort:low"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");

    const checkSorted = (
      deps: Record<string, string> | undefined,
      depsName: string,
    ): string | null => {
      if (!deps) return null;
      const keys = Object.keys(deps);
      const sorted = [...keys].sort((a, b) => a.localeCompare(b));
      if (keys.join(",") !== sorted.join(",")) return depsName;
      return null;
    };

    const unsorted = [
      checkSorted(parsed.dependencies, "dependencies"),
      checkSorted(parsed.devDependencies, "devDependencies"),
    ].filter(Boolean);

    if (unsorted.length > 0) {
      return fail(name, `Unsorted: ${unsorted.join(", ")}`);
    }
    return pass(name, "Dependencies sorted");
  },
};
