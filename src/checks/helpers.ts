import type { CheckResultBase } from "../types.js";

export function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

export function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

export function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

export function warn(name: string, message: string): CheckResultBase {
  return { name, status: "warn", message };
}
