/**
 * Why Screen
 *
 * Shows detailed explanation of why a check matters.
 */

import type { Screen } from "../../cli-framework/index.js";
import { blank, title, muted, text } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";

export const whyScreen: Screen<AppContext> = {
  id: "why",
  parent: "issue-detail",

  render: (ctx) => {
    const issue = ctx.issues[ctx.currentIssueIndex];
    if (issue === undefined) {
      title("No issue selected");
      blank();
      return;
    }

    title(`Why: ${issue.name}`);
    blank();

    if (issue.why === null) {
      muted("No detailed explanation available.");
    } else {
      // Render each line with proper indentation
      const lines = issue.why.split("\n");
      for (const line of lines) {
        text(line);
      }
    }

    blank();
  },

  options: () => [],
};
