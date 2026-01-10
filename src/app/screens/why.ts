/**
 * Why Screen
 *
 * Shows detailed explanation of why a check matters.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, title, muted, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const whyScreen: Screen<AppContext> = {
  id: "why",

  render: (ctx) => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (!issue) {
      title("No issue selected");
      blank();
      return;
    }

    title(`Why: ${issue.name}`);
    blank();

    if (issue.why) {
      // Render each line with proper indentation
      const lines = issue.why.split("\n");
      for (const line of lines) {
        text(line);
      }
    } else {
      muted("No detailed explanation available.");
    }

    blank();
  },

  options: (): Option<AppContext>[] => [
    action("fix", "Got it, fix this issue", async () => {
      return "issue-detail";
    }),
    action("back", "Back to issue", async () => {
      return "issue-detail";
    }),
  ],
};
