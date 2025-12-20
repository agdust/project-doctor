export type MigrateEslintOptions = {
  projectPath: string;
  dryRun?: boolean;
  backup?: boolean;
};

export type MigrationResult = {
  success: boolean;
  changes: string[];
  warnings: string[];
  errors: string[];
};

export async function migrateToFlatConfig(
  _options: MigrateEslintOptions
): Promise<MigrationResult> {
  // TODO: Implement
  // - Detect current eslint config format (.eslintrc.js, .eslintrc.json, etc.)
  // - Parse existing configuration
  // - Convert to flat config format (eslint.config.js)
  // - Handle extends, plugins, rules migration
  // - Optionally backup old files
  // - Create new eslint.config.js
  throw new Error("Not implemented");
}

export async function detectEslintConfigType(
  _projectPath: string
): Promise<"flat" | "legacy" | "none"> {
  // TODO: Implement
  throw new Error("Not implemented");
}
