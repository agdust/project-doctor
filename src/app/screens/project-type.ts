/**
 * Project Type Screen
 *
 * Allows user to select the project type with instant radio button selection.
 */

import type { Screen, Option } from "../../cli-framework/index.js";
import { action } from "../../cli-framework/index.js";
import { blank, title, muted } from "../../cli-framework/index.js";
import type { AppContext } from "../types.js";
import { setProjectType } from "../../config/loader.js";
import { rescanProject } from "../loader.js";

const PROJECT_TYPES = [
  {
    type: "js" as const,
    label: "JavaScript/Node",
    description: "Checks for: package.json, tsconfig, ESLint, Prettier, npm, deps, testing",
  },
  {
    type: "generic" as const,
    label: "Generic",
    description: "Universal checks only: git, gitignore, editorconfig, docs, env",
  },
];

export const projectTypeScreen: Screen<AppContext> = {
  id: "project-type",
  parent: "config",

  render: () => {
    title("Project Type");
    blank();
    muted("Select which type of project this is:");
    blank();
  },

  options: (ctx): Option<AppContext>[] => {
    const currentType = ctx.global.config.projectType;

    return PROJECT_TYPES.map((pt) => {
      const isCurrent = pt.type === currentType;
      const radio = isCurrent ? "●" : "○";
      const label = `${radio} ${pt.label}`;

      return action(
        pt.type,
        label,
        async (c) => {
          if (!isCurrent) {
            // Save to config file
            await setProjectType(c.projectPath, pt.type);
            // Rescan to apply new project type filters
            await rescanProject(c);
          }
          // Go back to config screen
          return "config";
        },
        pt.description
      );
    });
  },
};
