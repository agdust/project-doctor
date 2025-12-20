export type InitPrettierOptions = {
  projectPath: string;
  config?: Record<string, unknown>;
  installDependency?: boolean;
  addNpmScript?: boolean;
};

export async function initPrettier(_options: InitPrettierOptions): Promise<void> {
  // TODO: Implement
  // - Create .prettierrc.json with config
  // - Create .prettierignore
  // - Optionally install prettier as dev dependency
  // - Optionally add format script to package.json
  throw new Error("Not implemented");
}
