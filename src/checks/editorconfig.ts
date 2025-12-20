import type { Check, CheckResult } from "../types.ts";

const checkEditorconfigExists: Check = {
  name: "editorconfig-exists",
  description: "Check if .editorconfig file exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check if .editorconfig exists
    throw new Error("Not implemented");
  },
};

const checkEditorconfigContent: Check = {
  name: "editorconfig-content",
  description: "Validate .editorconfig has essential settings",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Parse .editorconfig
    // - Check for root = true
    // - Check for [*] section with indent_style, indent_size, end_of_line
    // - Check for charset and insert_final_newline
    throw new Error("Not implemented");
  },
};

export const checks = [checkEditorconfigExists, checkEditorconfigContent];
