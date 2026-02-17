import { describe, it, expect } from "vitest";
import { parseGitignore, emptyGitignore, isIgnored } from "./gitignore.js";

describe("gitignore utility", () => {
  describe("parseGitignore", () => {
    it("should ignore simple file patterns", () => {
      const gi = parseGitignore(".env\nnode_modules/");

      expect(gi.ignores(".env")).toBe(true);
      expect(gi.ignores("node_modules/package.json")).toBe(true);
      expect(gi.ignores("src/index.ts")).toBe(false);
    });

    it("should handle wildcard patterns", () => {
      const gi = parseGitignore("*.log\n.env.*");

      expect(gi.ignores("debug.log")).toBe(true);
      expect(gi.ignores("error.log")).toBe(true);
      expect(gi.ignores(".env.local")).toBe(true);
      expect(gi.ignores(".env.production")).toBe(true);
      expect(gi.ignores("app.ts")).toBe(false);
    });

    it("should handle directory patterns", () => {
      const gi = parseGitignore("dist/\nbuild/");

      expect(gi.ignores("dist/index.js")).toBe(true);
      expect(gi.ignores("dist/nested/file.js")).toBe(true);
      expect(gi.ignores("build/bundle.js")).toBe(true);
      expect(gi.ignores("src/dist.ts")).toBe(false);
    });

    it("should handle negation patterns", () => {
      const gi = parseGitignore("*.log\n!important.log");

      expect(gi.ignores("debug.log")).toBe(true);
      expect(gi.ignores("important.log")).toBe(false);
    });

    it("should ignore comments and empty lines", () => {
      const gi = parseGitignore("# This is a comment\n\n.env\n\n# Another comment\nnode_modules/");

      expect(gi.ignores(".env")).toBe(true);
      expect(gi.ignores("node_modules/package.json")).toBe(true);
      expect(gi.ignores("# This is a comment")).toBe(false);
    });

    it("should handle double-star patterns", () => {
      const gi = parseGitignore("**/*.test.ts\nlogs/**");

      expect(gi.ignores("src/foo.test.ts")).toBe(true);
      expect(gi.ignores("nested/deep/bar.test.ts")).toBe(true);
      expect(gi.ignores("logs/debug.log")).toBe(true);
      expect(gi.ignores("logs/nested/error.log")).toBe(true);
    });
  });

  describe("ignoresAny", () => {
    it("should return true if any path is ignored", () => {
      const gi = parseGitignore(".env\nnode_modules/");

      expect(gi.ignoresAny([".env", "src/index.ts"])).toBe(true);
      expect(gi.ignoresAny(["src/index.ts", "README.md"])).toBe(false);
    });
  });

  describe("ignoresAll", () => {
    it("should return true only if all paths are ignored", () => {
      const gi = parseGitignore(".env\n.env.local");

      expect(gi.ignoresAll([".env", ".env.local"])).toBe(true);
      expect(gi.ignoresAll([".env", "src/index.ts"])).toBe(false);
    });
  });

  describe("filterIgnored", () => {
    it("should return only ignored paths", () => {
      const gi = parseGitignore(".env\nnode_modules/");
      const paths = [".env", "node_modules/package.json", "src/index.ts"];

      expect(gi.filterIgnored(paths)).toEqual([".env", "node_modules/package.json"]);
    });
  });

  describe("filterNotIgnored", () => {
    it("should return only non-ignored paths", () => {
      const gi = parseGitignore(".env\nnode_modules/");
      const paths = [".env", "node_modules/package.json", "src/index.ts"];

      expect(gi.filterNotIgnored(paths)).toEqual(["src/index.ts"]);
    });
  });

  describe("emptyGitignore", () => {
    it("should not ignore anything", () => {
      const gi = emptyGitignore();

      expect(gi.ignores(".env")).toBe(false);
      expect(gi.ignores("node_modules/package.json")).toBe(false);
      expect(gi.ignores("anything")).toBe(false);
    });
  });

  describe("isIgnored", () => {
    it("should check if a path is ignored", () => {
      expect(isIgnored(".env\nnode_modules/", ".env")).toBe(true);
      expect(isIgnored(".env\nnode_modules/", "src/index.ts")).toBe(false);
    });

    it("should return false for null content", () => {
      expect(isIgnored(null, ".env")).toBe(false);
    });
  });

  describe("real-world gitignore patterns", () => {
    const realWorldGitignore = `
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
out/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

    it("should handle complex real-world gitignore", () => {
      const gi = parseGitignore(realWorldGitignore);

      // Dependencies
      expect(gi.ignores("node_modules/lodash/index.js")).toBe(true);

      // Build
      expect(gi.ignores("dist/index.js")).toBe(true);
      expect(gi.ignores("build/bundle.js")).toBe(true);
      expect(gi.ignores("tsconfig.tsbuildinfo")).toBe(true);

      // Environment
      expect(gi.ignores(".env")).toBe(true);
      expect(gi.ignores(".env.local")).toBe(true);
      expect(gi.ignores(".env.production.local")).toBe(true);

      // IDE
      expect(gi.ignores(".idea/workspace.xml")).toBe(true);
      expect(gi.ignores(".vscode/settings.json")).toBe(true);

      // OS
      expect(gi.ignores(".DS_Store")).toBe(true);

      // Test coverage
      expect(gi.ignores("coverage/lcov.info")).toBe(true);

      // Logs
      expect(gi.ignores("error.log")).toBe(true);
      expect(gi.ignores("npm-debug.log.1")).toBe(true);

      // Should NOT ignore source files
      expect(gi.ignores("src/index.ts")).toBe(false);
      expect(gi.ignores("package.json")).toBe(false);
      expect(gi.ignores("README.md")).toBe(false);
    });
  });
});
