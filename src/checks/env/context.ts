import type { GlobalContext } from "../../types.js";

export type EnvContext = {
  exampleRaw: string | null;
  exampleVars: string[];
};

export async function loadContext(global: GlobalContext): Promise<EnvContext> {
  const exampleRaw = await global.files.readText(".env.example");
  if (!exampleRaw) {
    return { exampleRaw: null, exampleVars: [] };
  }

  const exampleVars = exampleRaw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("=")[0])
    .filter(Boolean);

  return { exampleRaw, exampleVars };
}
