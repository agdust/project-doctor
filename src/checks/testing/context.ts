import type { GlobalContext } from "../../types.js";
import { safeJsonParse } from "../../utils/safe-json.js";

export interface TestingContext {
  hasTestScript: boolean;
  testScriptValue: string | null;
}

export async function loadContext(global: GlobalContext): Promise<TestingContext> {
  const pkgRaw = await global.files.readText("package.json");
  if (pkgRaw === null) {
    return { hasTestScript: false, testScriptValue: null };
  }

  const pkg = safeJsonParse<{ scripts?: { test?: string } }>(pkgRaw);
  if (!pkg) {
    return { hasTestScript: false, testScriptValue: null };
  }

  const testScript = pkg.scripts?.test;
  const hasTestScript = typeof testScript === "string" && testScript.length > 0;
  return {
    hasTestScript,
    testScriptValue: hasTestScript ? testScript : null,
  };
}
