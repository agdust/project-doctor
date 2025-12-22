import type { Check, CheckResultBase } from "../../types.js";
import type { EditorconfigContext } from "./context.js";

function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

export const exists: Check<EditorconfigContext> = {
  name: "editorconfig-exists",
  description: "Check if .editorconfig exists",
  tags: ["universal", "recommended"],
  run: async (_global, { raw }) => {
    if (!raw) return fail("editorconfig-exists", ".editorconfig not found");
    return pass("editorconfig-exists", ".editorconfig exists");
  },
};

export const hasRoot: Check<EditorconfigContext> = {
  name: "editorconfig-has-root",
  description: "Check if .editorconfig has root = true",
  tags: ["universal", "recommended"],
  run: async (_global, { raw, hasRoot }) => {
    if (!raw) return skip("editorconfig-has-root", "No .editorconfig");
    if (!hasRoot) return fail("editorconfig-has-root", "Missing root = true");
    return pass("editorconfig-has-root", "root = true present");
  },
};

export const hasIndent: Check<EditorconfigContext> = {
  name: "editorconfig-has-indent",
  description: "Check if .editorconfig has indent settings",
  tags: ["universal", "recommended"],
  run: async (_global, { raw, hasIndent }) => {
    if (!raw) return skip("editorconfig-has-indent", "No .editorconfig");
    if (!hasIndent) return fail("editorconfig-has-indent", "No indent settings");
    return pass("editorconfig-has-indent", "Indent settings present");
  },
};

export const checks = [exists, hasRoot, hasIndent];
