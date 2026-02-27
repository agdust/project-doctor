#!/usr/bin/env node
/**
 * Cross-platform asset copy script
 * Copies license templates to dist folder
 */

import fs from "node:fs";
import path from "node:path";

const src = "src/checks/docs/license-exists/licenses";
const dest = "dist/checks/docs/license-exists/licenses";

// Ensure destination directory exists
fs.mkdirSync(path.dirname(dest), { recursive: true });

// Copy recursively
fs.cpSync(src, dest, { recursive: true });

console.log(`Copied ${src} -> ${dest}`);
