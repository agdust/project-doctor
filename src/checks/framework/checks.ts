import type { Check, CheckResultBase } from "../../types.js";
import type { FrameworkContext } from "./context.js";

function pass(name: string, message: string): CheckResultBase {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResultBase {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResultBase {
  return { name, status: "skip", message };
}

export const svelte5Runes: Check<FrameworkContext> = {
  name: "svelte-5-runes",
  description: "Check if project uses Svelte 5 runes syntax",
  tags: ["framework:svelte", "opinionated"],
  run: async (global, _ctx) => {
    if (!global.detected.hasSvelte) {
      return skip("svelte-5-runes", "Svelte not detected");
    }
    // TODO: Implement actual check for runes usage
    // - Scan .svelte files for $state, $derived, $effect
    // - Check for deprecated syntax like $: reactive statements
    return pass("svelte-5-runes", "Check not yet implemented");
  },
};

export const svelteNoStores: Check<FrameworkContext> = {
  name: "svelte-no-stores",
  description: "Check if project avoids Svelte stores in favor of runes",
  tags: ["framework:svelte", "opinionated"],
  run: async (global, _ctx) => {
    if (!global.detected.hasSvelte) {
      return skip("svelte-no-stores", "Svelte not detected");
    }
    // TODO: Implement actual check
    // - Check for imports from 'svelte/store'
    // - Flag writable, readable, derived store usage
    return pass("svelte-no-stores", "Check not yet implemented");
  },
};

export const checks = [svelte5Runes, svelteNoStores];
