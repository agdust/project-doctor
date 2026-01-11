import type { GlobalContext } from "../../types.js";

export type EnvContext = {
  envExists: boolean;
  envVars: string[];
  exampleExists: boolean;
  exampleVars: string[];
};

function parseEnvVars(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("=")[0])
    .filter(Boolean);
}

export async function loadContext(global: GlobalContext): Promise<EnvContext> {
  const envRaw = await global.files.readText(".env");
  const exampleRaw = await global.files.readText(".env.example");

  return {
    envExists: envRaw !== null,
    envVars: envRaw ? parseEnvVars(envRaw) : [],
    exampleExists: exampleRaw !== null,
    exampleVars: exampleRaw ? parseEnvVars(exampleRaw) : [],
  };
}
