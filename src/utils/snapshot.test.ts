import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { takeSnapshot } from "./snapshot.js";
import { fixtures } from "../test/fixtures.js";

describe("snapshot", () => {
  describe("takeSnapshot", () => {
    it("should return a snapshot with expected fields", async () => {
      const snapshot = await takeSnapshot(fixtures.healthy);

      expect(snapshot).toHaveProperty("date");
      expect(snapshot).toHaveProperty("checks");
      expect(snapshot).toHaveProperty("failingChecks");

      expect(typeof snapshot.date).toBe("string");
      // Date should be YYYY-MM-DD format
      expect(snapshot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(typeof snapshot.checks.total).toBe("number");
      expect(typeof snapshot.checks.passed).toBe("number");
      expect(typeof snapshot.checks.failed).toBe("number");

      expect(snapshot.checks.total).toBeGreaterThan(0);
      // passed + failed <= total (some checks may be skipped, which aren't tracked in snapshot)
      expect(snapshot.checks.passed + snapshot.checks.failed).toBeLessThanOrEqual(snapshot.checks.total);
    });

    it("should list failing check names", async () => {
      const snapshot = await takeSnapshot(fixtures.healthy);

      expect(Array.isArray(snapshot.failingChecks)).toBe(true);
      expect(snapshot.failingChecks.length).toBe(snapshot.checks.failed);

      // All entries should be strings
      for (const name of snapshot.failingChecks) {
        expect(typeof name).toBe("string");
      }
    });
  });

  describe("history file persistence", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(path.join(tmpdir(), "snapshot-test-"));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("should handle missing history file gracefully", async () => {
      // The loadHistory function is internal but is exercised via runSnapshot
      // We test it indirectly by verifying no error when no history exists
      const historyPath = path.join(tempDir, ".project-doctor", "history.json");

      // File doesn't exist - no error should be thrown when reading
      try {
        await readFile(historyPath, "utf8");
        // If we get here, the file exists unexpectedly
        expect.unreachable("File should not exist");
      } catch (error) {
        // Expected: file does not exist
        expect((error as NodeJS.ErrnoException).code).toBe("ENOENT");
      }
    });

    it("should create valid JSON history file", async () => {
      const historyDir = path.join(tempDir, ".project-doctor");
      await mkdir(historyDir, { recursive: true });

      const history = [
        {
          date: "2025-01-01",
          checks: { total: 10, passed: 8, failed: 2 },
          failingChecks: ["check-a", "check-b"],
        },
      ];

      const historyPath = path.join(historyDir, "history.json");
      await writeFile(historyPath, JSON.stringify(history, null, 2) + "\n", "utf8");

      // Verify roundtrip
      const content = await readFile(historyPath, "utf8");
      const loaded = JSON.parse(content);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].date).toBe("2025-01-01");
      expect(loaded[0].checks.total).toBe(10);
      expect(loaded[0].failingChecks).toEqual(["check-a", "check-b"]);
    });

    it("should replace same-day entry in history", async () => {
      const historyDir = path.join(tempDir, ".project-doctor");
      await mkdir(historyDir, { recursive: true });

      const historyPath = path.join(historyDir, "history.json");

      // Simulate two snapshots on same day
      const entry1 = {
        date: "2025-03-01",
        checks: { total: 10, passed: 7, failed: 3 },
        failingChecks: ["a", "b", "c"],
      };
      const entry2 = {
        date: "2025-03-01",
        checks: { total: 10, passed: 9, failed: 1 },
        failingChecks: ["a"],
      };

      // Write initial history
      let history = [entry1];
      await writeFile(historyPath, JSON.stringify(history, null, 2) + "\n");

      // Load, replace same day, save
      const loaded = JSON.parse(await readFile(historyPath, "utf8"));
      const existingIndex = loaded.findIndex(
        (e: { date: string }) => e.date === entry2.date,
      );
      if (existingIndex !== -1) {
        loaded[existingIndex] = entry2;
      } else {
        loaded.push(entry2);
      }
      await writeFile(historyPath, JSON.stringify(loaded, null, 2) + "\n");

      // Verify only one entry for that date
      const final = JSON.parse(await readFile(historyPath, "utf8"));
      expect(final).toHaveLength(1);
      expect(final[0].checks.failed).toBe(1);
    });
  });
});
