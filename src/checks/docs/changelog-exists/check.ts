import { writeFile } from "node:fs/promises";
import path from "node:path";
import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "changelog-exists";

const DEFAULT_CHANGELOG = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed
`;

export const check: Check<DocsContext> = {
  name,
  description: "Check if CHANGELOG.md exists",
  tags: [TAG.universal, TAG.recommended, TAG.effort.low],
  run: (_global, { changelog }) => {
    if (changelog === null) {
      return fail(name, "CHANGELOG.md not found");
    }
    return pass(name, "CHANGELOG.md exists");
  },
  fix: {
    description: "Create CHANGELOG.md template",
    run: async (global) => {
      const changelogPath = path.join(global.projectPath, "CHANGELOG.md");
      await writeFile(changelogPath, DEFAULT_CHANGELOG, "utf8");
      return { success: true, message: "Created CHANGELOG.md" };
    },
  },
};
