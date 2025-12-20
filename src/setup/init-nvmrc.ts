export type InitNvmrcOptions = {
  projectPath: string;
  nodeVersion?: string;
  detectFromPackageJson?: boolean;
};

export async function initNvmrc(_options: InitNvmrcOptions): Promise<void> {
  // TODO: Implement
  // - Detect current node version or use provided
  // - Check package.json engines field
  // - Create .nvmrc file
  throw new Error("Not implemented");
}
