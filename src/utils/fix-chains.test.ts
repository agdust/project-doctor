import { describe, it, expect } from "vitest";
import {
  getDependencies,
  getChainRoot,
  compareByChain,
  sortByChainAndPriority,
} from "./fix-chains.js";

describe("fix-chains", () => {
  describe("getDependencies", () => {
    it("returns empty array for checks with no dependencies", () => {
      expect(getDependencies("size-limit-installed")).toEqual([]);
      expect(getDependencies("readme-exists")).toEqual([]);
      expect(getDependencies("unknown-check")).toEqual([]);
    });

    it("returns dependencies for checks in chains", () => {
      expect(getDependencies("size-limit-configured")).toEqual(["size-limit-installed"]);
      expect(getDependencies("size-limit-script")).toEqual([
        "size-limit-installed",
        "size-limit-configured",
      ]);
    });

    it("returns dependencies from multiple chains", () => {
      // editorconfig-has-root depends on editorconfig-exists
      expect(getDependencies("editorconfig-has-root")).toEqual(["editorconfig-exists"]);
    });
  });

  describe("getChainRoot", () => {
    it("returns the check itself if it has no dependencies", () => {
      expect(getChainRoot("size-limit-installed")).toBe("size-limit-installed");
      expect(getChainRoot("readme-exists")).toBe("readme-exists");
      expect(getChainRoot("unknown-check")).toBe("unknown-check");
    });

    it("returns the first element of the chain for dependent checks", () => {
      expect(getChainRoot("size-limit-configured")).toBe("size-limit-installed");
      expect(getChainRoot("size-limit-script")).toBe("size-limit-installed");
      expect(getChainRoot("env-example-not-empty")).toBe("env-example-exists");
      expect(getChainRoot("tsconfig-strict-enabled")).toBe("tsconfig-exists");
    });
  });

  describe("compareByChain", () => {
    it("returns -1 when first check must come before second", () => {
      expect(compareByChain("size-limit-installed", "size-limit-configured")).toBe(-1);
      expect(compareByChain("env-example-exists", "env-example-not-empty")).toBe(-1);
    });

    it("returns 1 when second check must come before first", () => {
      expect(compareByChain("size-limit-configured", "size-limit-installed")).toBe(1);
      expect(compareByChain("env-example-not-empty", "env-example-exists")).toBe(1);
    });

    it("returns 0 when checks have no dependency relationship", () => {
      expect(compareByChain("size-limit-installed", "readme-exists")).toBe(0);
      expect(compareByChain("unknown-check-a", "unknown-check-b")).toBe(0);
    });
  });

  describe("sortByChainAndPriority", () => {
    it("sorts checks by dependency depth first", () => {
      const checks = [
        { name: "size-limit-script", priority: 1 },
        { name: "size-limit-installed", priority: 3 },
        { name: "size-limit-configured", priority: 2 },
      ];

      const sorted = sortByChainAndPriority(checks, (c) => c.priority);
      expect(sorted.map((c) => c.name)).toEqual([
        "size-limit-installed",
        "size-limit-configured",
        "size-limit-script",
      ]);
    });

    it("sorts by priority within same dependency depth", () => {
      const checks = [
        { name: "readme-exists", priority: 5 },
        { name: "editorconfig-exists", priority: 3 },
        { name: "size-limit-installed", priority: 4 },
      ];

      const sorted = sortByChainAndPriority(checks, (c) => c.priority);
      expect(sorted.map((c) => c.name)).toEqual([
        "editorconfig-exists",
        "size-limit-installed",
        "readme-exists",
      ]);
    });

    it("handles checks not in any chain", () => {
      const checks = [
        { name: "unknown-check-b", priority: 2 },
        { name: "unknown-check-a", priority: 1 },
      ];

      const sorted = sortByChainAndPriority(checks, (c) => c.priority);
      expect(sorted.map((c) => c.name)).toEqual(["unknown-check-a", "unknown-check-b"]);
    });

    it("ensures dependencies come before dependent checks even with higher priority", () => {
      // size-limit-installed has higher priority (worse) but must come first
      const checks = [
        { name: "size-limit-script", priority: 0 }, // best priority but depends on others
        { name: "size-limit-installed", priority: 5 }, // worst priority but no deps
      ];

      const sorted = sortByChainAndPriority(checks, (c) => c.priority);
      expect(sorted.map((c) => c.name)).toEqual(["size-limit-installed", "size-limit-script"]);
    });
  });
});
