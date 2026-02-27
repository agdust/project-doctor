#!/usr/bin/env node
/**
 * Cross-platform script to make CLI executable
 * On Unix: sets executable permission
 * On Windows: no-op (not needed)
 */

import fs from "node:fs";

const file = "dist/cli.js";

if (!fs.existsSync(file)) {
  console.error(`Error: ${file} does not exist`);
  process.exit(1);
}

// chmod is only meaningful on Unix systems
// On Windows, this is effectively a no-op
try {
  fs.chmodSync(file, 0o755);
  console.log(`Made ${file} executable`);
} catch {
  // Silently ignore on Windows where chmod may not work as expected
  console.log(`Skipped chmod on ${file} (not supported on this platform)`);
}
