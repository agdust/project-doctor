import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**/*", "node_modules/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "src/**/*.test.ts",
        "src/test/**",
        "scripts/**",
        "**/*.d.ts",
      ],
    },
  },
});
