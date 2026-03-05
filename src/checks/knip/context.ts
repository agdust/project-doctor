import type { GlobalContext } from "../../types.js";

export interface KnipContext {
  hasKnip: boolean;
}

export function loadContext(global: GlobalContext): KnipContext {
  return {
    hasKnip: global.detected.hasKnip,
  };
}
