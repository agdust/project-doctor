import type { GlobalContext } from "../../types.js";

export type FrameworkContext = {
  // Add framework-specific parsed data here as needed
};

export async function loadContext(_global: GlobalContext): Promise<FrameworkContext> {
  return {};
}
