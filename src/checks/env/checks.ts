import type { Check, CheckResultBase } from "../../types.js";
import type { EnvContext } from "./context.js";

function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

export const exampleExists: Check<EnvContext> = {
  name: "env-example-exists",
  description: "Check if .env.example exists",
  tags: ["universal", "recommended"],
  run: async (_global, { exampleRaw }) => {
    if (!exampleRaw) return fail("env-example-exists", ".env.example not found");
    return pass("env-example-exists", ".env.example exists");
  },
};

export const exampleNotEmpty: Check<EnvContext> = {
  name: "env-example-not-empty",
  description: "Check if .env.example has content",
  tags: ["universal", "recommended"],
  run: async (_global, { exampleRaw, exampleVars }) => {
    if (!exampleRaw) return skip("env-example-not-empty", "No .env.example");
    if (exampleVars.length === 0) {
      return fail("env-example-not-empty", ".env.example is empty");
    }
    return pass("env-example-not-empty", `${exampleVars.length} vars documented`);
  },
};

export const checks = [exampleExists, exampleNotEmpty];
