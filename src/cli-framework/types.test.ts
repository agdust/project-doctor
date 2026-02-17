/**
 * CLI Framework Types Tests
 */

import { describe, it, expect } from "vitest";
import { action, nav, separator, back } from "./types.js";

describe("cli-framework/types", () => {
  describe("action()", () => {
    it("creates an action option with required fields", () => {
      const run = async () => {};
      const opt = action("test", "Test Label", run);

      expect(opt.type).toBe("action");
      expect(opt.value).toBe("test");
      expect(opt.label).toBe("Test Label");
      expect(opt.run).toBe(run);
      expect(opt.description).toBeUndefined();
    });

    it("creates an action option with description", () => {
      const run = async () => {};
      const opt = action("test", "Test Label", run, "Test description");

      expect(opt.type).toBe("action");
      expect(opt.description).toBe("Test description");
    });

    it("action can return a screen ID for navigation", async () => {
      const run = async () => "next-screen";
      const opt = action("test", "Test", run);

      const result = await opt.run({});
      expect(result).toBe("next-screen");
    });

    it("action can return void to stay on screen", async () => {
      const run = async () => {};
      const opt = action("test", "Test", run);

      const result = await opt.run({});
      expect(result).toBeUndefined();
    });
  });

  describe("nav()", () => {
    it("creates a navigation option with required fields", () => {
      const opt = nav("go-home", "Home", "home-screen");

      expect(opt.type).toBe("nav");
      expect(opt.value).toBe("go-home");
      expect(opt.label).toBe("Home");
      expect(opt.to).toBe("home-screen");
      expect(opt.description).toBeUndefined();
      expect(opt.badge).toBeUndefined();
    });

    it("creates a navigation option with description", () => {
      const opt = nav("go-home", "Home", "home-screen", {
        description: "Go to home screen",
      });

      expect(opt.description).toBe("Go to home screen");
    });

    it("creates a navigation option with badge", () => {
      const opt = nav("issues", "Issues", "issues-screen", {
        badge: "3 new",
      });

      expect(opt.badge).toBe("3 new");
    });

    it("creates a navigation option with both description and badge", () => {
      const opt = nav("issues", "Issues", "issues-screen", {
        description: "View issues",
        badge: "5 critical",
      });

      expect(opt.description).toBe("View issues");
      expect(opt.badge).toBe("5 critical");
    });
  });

  describe("separator()", () => {
    it("creates a separator without label", () => {
      const opt = separator();

      expect(opt.type).toBe("separator");
      expect(opt.label).toBeUndefined();
    });

    it("creates a separator with label", () => {
      const opt = separator("Actions");

      expect(opt.type).toBe("separator");
      expect(opt.label).toBe("Actions");
    });
  });

  describe("back()", () => {
    it("creates a back navigation option", () => {
      const opt = back();

      expect(opt.type).toBe("nav");
      expect(opt.value).toBe("__back__");
      expect(opt.label).toBe("← Back");
      expect(opt.to).toBe("__back__");
    });
  });
});
