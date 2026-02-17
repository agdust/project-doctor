#!/usr/bin/env node
/**
 * Build-time script to compile all docs.md files into a single JSON manifest.
 * Uses `marked` for markdown parsing.
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const checksDir = join(__dirname, "..", "src", "checks");
const outputDir = join(__dirname, "..", "dist");
const outputFile = join(outputDir, "docs-manifest.json");

/**
 * Extract plain text from the "## Why" section
 */
function extractWhyText(markdown) {
  const match = /## Why\n\n([\s\S]*?)(?=\n## |$)/.exec(markdown);
  return match ? match[1].trim() : null;
}

/**
 * Extract plain text from the "## Why" section and convert to HTML
 */
function extractWhyHtml(markdown) {
  const whyText = extractWhyText(markdown);
  if (!whyText) return null;
  return marked.parse(whyText);
}

/**
 * Scan all check folders and compile docs
 */
async function compileAllDocs() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    checks: {},
  };

  const groups = await readdir(checksDir);

  for (const group of groups) {
    const groupPath = join(checksDir, group);

    try {
      const items = await readdir(groupPath);

      for (const item of items) {
        const itemPath = join(groupPath, item);
        const docsPath = join(itemPath, "docs.md");
        const checkPath = join(itemPath, "check.ts");

        try {
          const [docsContent, checkContent] = await Promise.all([
            readFile(docsPath, "utf-8"),
            readFile(checkPath, "utf-8"),
          ]);

          // Extract name from first h1 (# heading)
          const nameMatch = /^# (.+)$/m.exec(docsContent);
          const name = nameMatch ? nameMatch[1].trim() : `${group}-${item}`;

          // Extract description (first paragraph after h1)
          const descMatch = /^# .+\n\n(.+?)(\n\n|$)/m.exec(docsContent);
          const description = descMatch ? descMatch[1].trim() : "";

          // Extract tags from check.ts
          const tagsMatch = /tags:\s*\[([^\]]+)\]/.exec(checkContent);
          const tags = tagsMatch
            ? tagsMatch[1].split(",").map((t) => t.trim().replace(/['"]/g, ""))
            : [];

          // Check if fix is available
          const hasFix = /fix:\s*\{/.test(checkContent);

          // Parse markdown to HTML
          const fullHtml = marked.parse(docsContent);
          const whyText = extractWhyText(docsContent);
          const whyHtml = extractWhyHtml(docsContent);

          manifest.checks[name] = {
            name,
            group,
            description,
            tags,
            hasFix,
            whyText,
            whyHtml,
            fullHtml,
          };
        } catch {
          // Not a check folder with docs, skip
        }
      }
    } catch {
      // Not a directory, skip
    }
  }

  return manifest;
}

async function main() {
  console.log("Compiling docs...");

  const manifest = await compileAllDocs();
  const checkCount = Object.keys(manifest.checks).length;

  console.log(`Found ${checkCount} checks with documentation`);

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Write manifest
  await writeFile(outputFile, JSON.stringify(manifest, null, 2));
  console.log(`Written to ${outputFile}`);
}

main().catch((err) => {
  console.error("Failed to compile docs:", err);
  process.exit(1);
});
