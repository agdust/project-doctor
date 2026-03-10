/**
 * Check: deps-replaceable-modules
 *
 * Detects dependencies that have modern replacements available, using
 * curated manifests from the module-replacements package.
 */

import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { DepsContext } from "../context.js";
import { pass } from "../../helpers.js";

import nativeManifest from "module-replacements/manifests/native.json" with { type: "json" };
import preferredManifest from "module-replacements/manifests/preferred.json" with { type: "json" };
import microManifest from "module-replacements/manifests/micro-utilities.json" with { type: "json" };

function buildReplacementMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of nativeManifest.moduleReplacements) {
    map.set(entry.moduleName, entry.replacement ?? "native replacement available");
  }
  for (const entry of preferredManifest.moduleReplacements) {
    map.set(entry.moduleName, "preferred alternative available");
  }
  for (const entry of microManifest.moduleReplacements) {
    map.set(entry.moduleName, entry.replacement ?? "micro-utility replacement available");
  }
  return map;
}

const replacementMap = buildReplacementMap();

const name = "deps-replaceable-modules";

export const check: Check<DepsContext> = {
  name,
  description: "Check for dependencies with available modern replacements",
  tags: [TAG.node, TAG.recommended, TAG.effort.medium],
  run: (_global, { dependencies, devDependencies }) => {
    const allDeps = { ...dependencies, ...devDependencies };
    const found: { pkg: string; replacement: string }[] = [];

    for (const pkg of Object.keys(allDeps)) {
      const replacement = replacementMap.get(pkg);
      if (replacement !== undefined) {
        found.push({ pkg, replacement });
      }
    }

    if (found.length === 0) {
      return pass(name, "No replaceable dependencies found");
    }

    const details = found.map((f) => `${f.pkg} → ${f.replacement}`);
    const message =
      `Found ${found.length} replaceable ${found.length === 1 ? "dependency" : "dependencies"}. ` +
      `Install eslint-plugin-depend to get ongoing lint warnings for replaceable modules.`;

    return { name, status: "fail", message, details };
  },
};
