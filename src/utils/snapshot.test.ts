import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { takeSnapshot, runSnapshot, runHistory } from "./snapshot.js";
import { fixtures } from "../test/fixtures.js";

describe("snapshot", () => {
  describe("takeSnapshot", () => {
    it("should return a snapshot entry with date, checks, and failingChecks", async () => {
      const snapshot = await takeSnapshot(fixtures.healthy);

      // Verify shape
      expect(snapshot).toHaveProperty("date");
      expect(snapshot).toHaveProperty("checks");
      expect(snapshot).toHaveProperty("failingChecks");

      // Date is YYYY-MM-DD
      expect(snapshot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Check counts are numbers
      expect(typeof snapshot.checks.total).toBe("number");
      expect(typeof snapshot.checks.passed).toBe("number");
      expect(typeof snapshot.checks.failed).toBe("number");

      // Total should include all checks run
      expect(snapshot.checks.total).toBeGreaterThan(0);
      // passed + failed can be <= total (skipped checks add to total but not to passed/failed)
      expect(snapshot.checks.passed + snapshot.checks.failed).toBeLessThanOrEqual(
        snapshot.checks.total,
      );
      expect(snapshot.checks.passed).toBeGreaterThanOrEqual(0);
      expect(snapshot.checks.failed).toBeGreaterThanOrEqual(0);
    });

    it("should have failingChecks array matching failed count", async () => {
      const snapshot = await takeSnapshot(fixtures.healthy);

      expect(Array.isArray(snapshot.failingChecks)).toBe(true);
      expect(snapshot.failingChecks.length).toBe(snapshot.checks.failed);

      for (const name of snapshot.failingChecks) {
        expect(typeof name).toBe("string");
        expect(name.length).toBeGreaterThan(0);
      }
    });

    it("should detect more failures on a broken project than a healthy one", async () => {
      const healthySnapshot = await takeSnapshot(fixtures.healthy);
      const brokenSnapshot = await takeSnapshot(fixtures.broken);

      expect(brokenSnapshot.checks.failed).toBeGreaterThan(healthySnapshot.checks.failed);
    });
  });

  describe("runSnapshot", () => {
    let tempDir: string;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(tmpdir(), "snapshot-test-"));
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(async () => {
      consoleSpy.mockRestore();
      await rm(tempDir, { recursive: true, force: true });
    });

    it("should create a history file with one entry", async () => {
      // Create a minimal JS project so checks can run
      const { writeFile } = await import("node:fs/promises");
      await writeFile(path.join(tempDir, "package.json"), '{"name":"test"}');

      await runSnapshot(tempDir);

      // Verify file was created
      const historyPath = path.join(tempDir, ".project-doctor", "history.json");
      const content = await readFile(historyPath, "utf8");
      const history = JSON.parse(content);

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty("date");
      expect(history[0]).toHaveProperty("checks");
      expect(history[0]).toHaveProperty("failingChecks");
      expect(history[0].checks.total).toBeGreaterThan(0);
    });

    it("should replace same-day entry on second run", async () => {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(path.join(tempDir, "package.json"), '{"name":"test"}');

      // Run twice on same day
      await runSnapshot(tempDir);
      await runSnapshot(tempDir);

      const historyPath = path.join(tempDir, ".project-doctor", "history.json");
      const content = await readFile(historyPath, "utf8");
      const history = JSON.parse(content);

      // Should still have only one entry (same day replaced)
      expect(history).toHaveLength(1);
    });

    it("should output confirmation to console", async () => {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(path.join(tempDir, "package.json"), '{"name":"test"}');

      await runSnapshot(tempDir);

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      expect(output).toContain("Snapshot saved");
      expect(output).toContain("checks passing");
    });
  });

  describe("runHistory", () => {
    let tempDir: string;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(tmpdir(), "history-test-"));
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(async () => {
      consoleSpy.mockRestore();
      await rm(tempDir, { recursive: true, force: true });
    });

    it("should show 'no snapshots' message when history is empty", async () => {
      await runHistory(tempDir);

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      expect(output).toContain("No snapshots yet");
    });

    it("should display history entries", async () => {
      // Seed a history file
      const historyDir = path.join(tempDir, ".project-doctor");
      await mkdir(historyDir, { recursive: true });
      const { writeFile } = await import("node:fs/promises");
      const history = [
        {
          date: "2025-01-15",
          checks: { total: 50, passed: 40, failed: 10 },
          failingChecks: [],
        },
        {
          date: "2025-02-15",
          checks: { total: 50, passed: 45, failed: 5 },
          failingChecks: [],
        },
      ];
      await writeFile(
        path.join(historyDir, "history.json"),
        JSON.stringify(history, null, 2) + "\n",
      );

      await runHistory(tempDir);

      const output = consoleSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
      expect(output).toContain("Project Health History");
      expect(output).toContain("2025-01-15");
      expect(output).toContain("2025-02-15");
      // Should show progress (fixed 5 issues)
      expect(output).toContain("Fixed 5 issues");
    });

    it("should handle missing history file gracefully", async () => {
      // No history file at all — should not throw, just show "no snapshots"
      await expect(runHistory(tempDir)).resolves.not.toThrow();
    });
  });
});
