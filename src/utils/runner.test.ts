import { describe, it, expect } from "vitest";
import { fixtures } from "../test/fixtures.js";
import { runChecks } from "./runner.js";

describe("runner", () => {
  describe("shell-only project", () => {
    it("should skip tsconfig checks when no TypeScript is detected", async () => {
      const results = await runChecks({
        projectPath: fixtures.shellOnly,
        skipConfig: true,
      });

      const tsconfigResults = results.filter((r) => r.group === "tsconfig");

      expect(tsconfigResults).toHaveLength(1);
      expect(tsconfigResults[0].status).toBe("skip");
      expect(tsconfigResults[0].name).toBe("tsconfig-not-detected");
      expect(tsconfigResults[0].message).toBe("TypeScript not detected");
    });

    it("should skip eslint checks when no ESLint is detected", async () => {
      const results = await runChecks({
        projectPath: fixtures.shellOnly,
        skipConfig: true,
      });

      const eslintResults = results.filter((r) => r.group === "eslint");

      expect(eslintResults).toHaveLength(1);
      expect(eslintResults[0].status).toBe("skip");
      expect(eslintResults[0].name).toBe("eslint-not-detected");
      expect(eslintResults[0].message).toBe("ESLint not detected");
    });

    it("should skip prettier checks when no Prettier is detected", async () => {
      const results = await runChecks({
        projectPath: fixtures.shellOnly,
        skipConfig: true,
      });

      const prettierResults = results.filter((r) => r.group === "prettier");

      expect(prettierResults).toHaveLength(1);
      expect(prettierResults[0].status).toBe("skip");
      expect(prettierResults[0].name).toBe("prettier-not-detected");
      expect(prettierResults[0].message).toBe("Prettier not detected");
    });

    it("should not run any tsconfig, eslint, or prettier checks in shell-only project", async () => {
      const results = await runChecks({
        projectPath: fixtures.shellOnly,
        skipConfig: true,
      });

      // Should only have skip results for these groups, no actual check runs
      const toolGroups = ["tsconfig", "eslint", "prettier"];
      const toolResults = results.filter((r) => toolGroups.includes(r.group));

      // Each group should have exactly one "not-detected" skip result
      for (const group of toolGroups) {
        const groupResults = toolResults.filter((r) => r.group === group);
        expect(groupResults).toHaveLength(1);
        expect(groupResults[0].status).toBe("skip");
        expect(groupResults[0].name).toBe(`${group}-not-detected`);
      }
    });
  });
});
