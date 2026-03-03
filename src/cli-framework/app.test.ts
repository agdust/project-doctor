/**
 * CLI Framework App Tests
 */

import { describe, it, expect } from "vitest";
import { App } from "./app.js";
import type { AppConfig, Screen } from "./types.js";
import { action, nav, separator } from "./helpers.js";

// Simple test context
interface TestContext {
  counter: number;
  visited: string[];
}

// Helper to create a basic app config
function createTestConfig(
  screens: Screen<TestContext>[],
  overrides: Partial<AppConfig<TestContext>> = {},
): AppConfig<TestContext> {
  return {
    name: "test-app",
    context: { counter: 0, visited: [] },
    screens,
    ...overrides,
  };
}

describe("cli-framework/App", () => {
  describe("constructor", () => {
    it("throws when no screens are defined", () => {
      expect(() => {
        new App(createTestConfig([]));
      }).toThrow("No screens defined");
    });

    it("initializes with first screen by default", () => {
      const screens: Screen<TestContext>[] = [
        { id: "screen-a", render: () => {}, options: [] },
        { id: "screen-b", render: () => {}, options: [] },
      ];

      const app = new App(createTestConfig(screens));

      expect(app.getCurrentScreen()).toBe("screen-a");
    });

    it("initializes with specified initial screen", () => {
      const screens: Screen<TestContext>[] = [
        { id: "screen-a", render: () => {}, options: [] },
        { id: "screen-b", render: () => {}, options: [] },
      ];

      const app = new App(createTestConfig(screens, { initialScreen: "screen-b" }));

      expect(app.getCurrentScreen()).toBe("screen-b");
    });

    it("initializes context from config", () => {
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      const app = new App(
        createTestConfig(screens, {
          context: { counter: 42, visited: ["initial"] },
        }),
      );

      expect(app.getContext()).toEqual({ counter: 42, visited: ["initial"] });
    });
  });

  describe("getContext()", () => {
    it("returns the current context", () => {
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      const app = new App(createTestConfig(screens));

      const ctx = app.getContext();
      expect(ctx.counter).toBe(0);
      expect(ctx.visited).toEqual([]);
    });

    it("returns mutable context", () => {
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      const app = new App(createTestConfig(screens));
      const ctx = app.getContext();

      ctx.counter = 10;
      ctx.visited.push("test");

      expect(app.getContext().counter).toBe(10);
      expect(app.getContext().visited).toContain("test");
    });
  });

  describe("getCurrentScreen()", () => {
    it("returns the current screen ID", () => {
      const screens: Screen<TestContext>[] = [
        { id: "home", render: () => {}, options: [] },
        { id: "settings", render: () => {}, options: [] },
      ];

      const app = new App(createTestConfig(screens));

      expect(app.getCurrentScreen()).toBe("home");
    });
  });

  describe("exit()", () => {
    it("marks app for exit", () => {
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      const app = new App(createTestConfig(screens));
      // App starts not exiting
      expect(app.getCurrentScreen()).toBe("home");

      app.exit();
      // After exit(), the app loop will end on next iteration
      // We can't easily test this without running the app
    });
  });

  describe("screen definitions", () => {
    it("accepts static options array", () => {
      const screens: Screen<TestContext>[] = [
        {
          id: "home",
          render: () => {},
          options: [
            action("test", "Test", async () => {}),
            nav("nav", "Navigate", "other"),
            separator("Section"),
          ],
        },
      ];

      // Should not throw
      const app = new App(createTestConfig(screens));
      expect(app.getCurrentScreen()).toBe("home");
    });

    it("accepts dynamic options function", () => {
      const screens: Screen<TestContext>[] = [
        {
          id: "home",
          render: () => {},
          options: (ctx) => [action("test", `Count: ${ctx.counter}`, async () => {})],
        },
      ];

      // Should not throw
      const app = new App(createTestConfig(screens));
      expect(app.getCurrentScreen()).toBe("home");
    });

    it("accepts parent for back navigation", () => {
      const screens: Screen<TestContext>[] = [
        { id: "home", render: () => {}, options: [] },
        { id: "child", parent: "home", render: () => {}, options: [] },
      ];

      const app = new App(createTestConfig(screens, { initialScreen: "child" }));
      expect(app.getCurrentScreen()).toBe("child");
    });

    it("accepts noBack to disable auto back option", () => {
      const screens: Screen<TestContext>[] = [
        { id: "home", render: () => {}, options: [] },
        { id: "child", parent: "home", noBack: true, render: () => {}, options: [] },
      ];

      // Should not throw
      const app = new App(createTestConfig(screens));
      expect(app.getCurrentScreen()).toBe("home");
    });
  });

  describe("displayName", () => {
    it("accepts string displayName", () => {
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      // Should not throw
      const app = new App(createTestConfig(screens, { displayName: "My App" }));
      expect(app.getCurrentScreen()).toBe("home");
    });

    it("accepts function displayName", () => {
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      // Should not throw
      const app = new App(
        createTestConfig(screens, { displayName: (ctx) => `App (${ctx.counter})` }),
      );
      expect(app.getCurrentScreen()).toBe("home");
    });
  });

  describe("lifecycle hooks", () => {
    it("accepts onEnter hook", () => {
      const screens: Screen<TestContext>[] = [
        {
          id: "home",
          render: () => {},
          options: [],
          onEnter: async (ctx) => {
            ctx.visited.push("home");
          },
        },
      ];

      // Should not throw
      const app = new App(createTestConfig(screens));
      expect(app.getCurrentScreen()).toBe("home");
    });

    it("accepts onLeave hook", () => {
      const screens: Screen<TestContext>[] = [
        {
          id: "home",
          render: () => {},
          options: [],
          onLeave: async (ctx) => {
            ctx.visited.push("left-home");
          },
        },
      ];

      // Should not throw
      const app = new App(createTestConfig(screens));
      expect(app.getCurrentScreen()).toBe("home");
    });

    it("accepts onExit hook", () => {
      let exitCalled = false;
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      const app = new App(
        createTestConfig(screens, {
          onExit: () => {
            exitCalled = true;
          },
        }),
      );

      // onExit should not be called yet
      expect(exitCalled).toBe(false);
    });

    it("accepts onEsc hook", () => {
      const screens: Screen<TestContext>[] = [{ id: "home", render: () => {}, options: [] }];

      // Should not throw
      const app = new App(
        createTestConfig(screens, {
          onEsc: () => "stay",
        }),
      );
      expect(app.getCurrentScreen()).toBe("home");
    });
  });
});
