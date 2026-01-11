import type { GlobalContext } from "../../types.js";

export type TestingContext = {
  hasTestScript: boolean;
  testScriptValue: string | null;
};

export async function loadContext(global: GlobalContext): Promise<TestingContext> {
  const pkgRaw = await global.files.readText("package.json");
  if (!pkgRaw) {
    return { hasTestScript: false, testScriptValue: null };
  }

  try {
    const pkg = JSON.parse(pkgRaw);
    const testScript = pkg.scripts?.test;
    const hasTestScript = typeof testScript === "string" && testScript.length > 0;
    return {
      hasTestScript,
      testScriptValue: hasTestScript ? testScript : null,
    };
  } catch {
    return { hasTestScript: false, testScriptValue: null };
  }
}
