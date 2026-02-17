#!/usr/bin/env node
/**
 * Cross-platform clean script
 * Removes dist folder
 */

import { rmSync, existsSync } from "node:fs";

const dir = "dist";

if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true });
  console.log(`Removed ${dir}/`);
} else {
  console.log(`${dir}/ does not exist, nothing to clean`);
}
