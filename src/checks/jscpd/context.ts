import type { GlobalContext } from "../../types.js";

export type JscpdContext = {
  hasConfig: boolean;
};

export async function loadContext(global: GlobalContext): Promise<JscpdContext> {
  const [hasJscpdJson, hasJscpdrc] = await Promise.all([
    global.files.exists(".jscpd.json"),
    global.files.exists(".jscpdrc"),
  ]);

  return {
    hasConfig: hasJscpdJson || hasJscpdrc,
  };
}
