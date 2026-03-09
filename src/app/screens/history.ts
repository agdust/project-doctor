/**
 * History Screen
 *
 * Shows project health history and allows taking snapshots.
 */

import { bold, dim, green, red } from "../../utils/colors.js";
import type { Screen, Option } from "../../cli-framework/index.js";
import { action, blank, text, success, ICONS } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { SCREEN } from "../screen-ids.js";
import { loadHistory, createSnapshotFromResults, upsertSnapshot } from "../../utils/snapshot.js";

export const historyScreen: Screen<AppContext> = {
  id: SCREEN.history,
  parent: SCREEN.home,

  onEnter: async (ctx) => {
    ctx.historyEntries = await loadHistory(ctx.projectPath);
    return undefined;
  },

  render: (ctx) => {
    const history = ctx.historyEntries;

    if (history.length === 0) {
      text(dim("No snapshots yet."));
      text(dim("Take a snapshot to start tracking project health over time."));
      blank();
      return;
    }

    text(bold("Project Health History"));
    blank();
    text(dim("Date          Checks"), 2);
    text(dim("─────────────────────────"), 2);

    for (const entry of history) {
      const checkStatus = entry.checks.failed === 0 ? green(ICONS.pass) : red(ICONS.fail);
      const checkText = `${entry.checks.passed}/${entry.checks.total}`;
      text(`${entry.date}    ${checkStatus} ${checkText}`, 2);
    }

    // Show progress if multiple entries
    if (history.length >= 2) {
      const first = history[0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- history.length >= 2 guaranteed above
      const last = history.at(-1)!;
      const checkDiff = last.checks.failed - first.checks.failed;

      blank();
      if (checkDiff < 0) {
        text(
          green(
            `↑ Fixed ${Math.abs(checkDiff)} issue${Math.abs(checkDiff) > 1 ? "s" : ""} since ${first.date}`,
          ),
          2,
        );
      } else if (checkDiff > 0) {
        text(red(`↓ ${checkDiff} new issue${checkDiff > 1 ? "s" : ""} since ${first.date}`), 2);
      } else {
        text(dim(`→ No change since ${first.date}`), 2);
      }
    }

    blank();
  },

  options: (): Option<AppContext>[] => [
    action("snapshot", "Take snapshot", async (c) => {
      const snapshot = createSnapshotFromResults(c.allResults);
      const history = await upsertSnapshot(c.projectPath, snapshot);

      // Update context for immediate re-render
      c.historyEntries = history;

      blank();
      success(
        `Snapshot saved for ${snapshot.date} — ${snapshot.checks.passed}/${snapshot.checks.total} passing`,
        3,
      );
      blank();

      // Stay on screen to show updated history
      return SCREEN.history;
    }),
  ],
};
