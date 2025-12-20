export type InitGitignoreOptions = {
  projectPath: string;
  template?: "node" | "minimal" | "full";
  merge?: boolean;
};

const NODE_GITIGNORE_PATTERNS = [
  "node_modules/",
  "dist/",
  "build/",
  ".env",
  ".env.local",
  ".env.*.local",
  "*.log",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  ".DS_Store",
  "Thumbs.db",
  "coverage/",
  ".nyc_output/",
];

export async function initGitignore(_options: InitGitignoreOptions): Promise<void> {
  // TODO: Implement
  // - Detect project type
  // - Generate appropriate .gitignore content
  // - Optionally merge with existing .gitignore
  throw new Error("Not implemented");
}

export async function addGitignorePatterns(
  _projectPath: string,
  _patterns: string[]
): Promise<void> {
  // TODO: Implement
  // - Read existing .gitignore
  // - Add new patterns (avoiding duplicates)
  // - Write updated file
  throw new Error("Not implemented");
}
