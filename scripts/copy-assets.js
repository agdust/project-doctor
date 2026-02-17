#!/usr/bin/env node
/**
 * Cross-platform asset copy script
 * Copies license templates to dist folder
 */

import { cpSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const src = "src/checks/docs/license-exists/licenses";
const dest = "dist/checks/docs/license-exists/licenses";

// Ensure destination directory exists
mkdirSync(dirname(dest), { recursive: true });

// Copy recursively
cpSync(src, dest, { recursive: true });

console.log(`Copied ${src} -> ${dest}`);
