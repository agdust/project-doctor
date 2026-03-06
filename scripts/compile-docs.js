#!/usr/bin/env node
/**
 * Build-time script to compile all docs.md files into a single JSON manifest.
 * Uses `marked` for markdown parsing.
 */

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { marked } from "marked";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const checksDir = path.join(__dirname, "..", "src", "checks");
const outputDir = path.join(__dirname, "..", "dist");
const outputFile = path.join(outputDir, "docs-manifest.json");

/**
 * Parse JSON frontmatter from markdown content.
 * Returns { data, content } where data is the parsed frontmatter
 * and content is the markdown without the frontmatter block.
 */
function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return { data: {}, content: markdown };
  }
  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { data: {}, content: markdown };
  }
  const frontmatterBlock = markdown.slice(4, endIndex);
  const content = markdown.slice(endIndex + 5);
  const data = JSON.parse(frontmatterBlock);
  return { data, content };
}

/**
 * Extract tokens belonging to the "## Why" section using marked's lexer
 */
function getWhyTokens(markdown) {
  const tokens = marked.lexer(markdown);
  let inWhy = false;
  const whyTokens = [];

  for (const token of tokens) {
    if (token.type === "heading" && token.depth === 2) {
      if (token.text === "Why") {
        inWhy = true;
        continue;
      }
      if (inWhy) break;
    }
    if (inWhy) whyTokens.push(token);
  }

  return whyTokens.length > 0 ? whyTokens : null;
}

/**
 * Extract plain text from the "## Why" section
 */
function extractWhyText(markdown) {
  const tokens = getWhyTokens(markdown);
  if (!tokens) return null;
  return tokens.map((t) => t.raw).join("").trim();
}

/**
 * Extract plain text from the "## Why" section and convert to HTML
 */
function extractWhyHtml(markdown) {
  const tokens = getWhyTokens(markdown);
  if (!tokens) return null;
  const list = Object.assign(tokens, { links: {} });
  return marked.parser(list);
}

/**
 * Extract name (first h1) and description (first paragraph after h1) using marked's lexer
 */
function extractNameAndDescription(markdown, fallbackName) {
  const tokens = marked.lexer(markdown);
  let name = fallbackName;
  let description = "";
  let foundH1 = false;

  for (const token of tokens) {
    if (!foundH1 && token.type === "heading" && token.depth === 1) {
      name = token.text;
      foundH1 = true;
      continue;
    }
    if (foundH1 && token.type === "paragraph") {
      description = token.text;
      break;
    }
    if (foundH1 && token.type === "heading") break;
  }

  return { name, description };
}

/**
 * Scan all check folders and compile docs
 */
async function compileAllDocs() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    checks: {},
  };

  const groups = await fs.readdir(checksDir);

  for (const group of groups) {
    const groupPath = path.join(checksDir, group);

    try {
      const items = await fs.readdir(groupPath);

      for (const item of items) {
        const itemPath = path.join(groupPath, item);
        const docsPath = path.join(itemPath, "docs.md");
        const checkPath = path.join(itemPath, "check.ts");

        try {
          const [docsContent, checkContent] = await Promise.all([
            fs.readFile(docsPath, "utf-8"),
            fs.readFile(checkPath, "utf-8"),
          ]);

          // Parse frontmatter and strip it from content
          const { data: frontmatter, content: markdownContent } = parseFrontmatter(docsContent);

          // Use marked's lexer for structured markdown parsing
          const { name, description } = extractNameAndDescription(
            markdownContent,
            `${group}-${item}`,
          );

          // Extract tags from check.ts
          const tagsMatch = /tags:\s*\[([^\]]+)\]/.exec(checkContent);
          const tags = tagsMatch
            ? tagsMatch[1].split(",").map((t) => t.trim().replace(/['"]/g, ""))
            : [];

          // Check if fix is available
          const hasFix = /fix:\s*\{/.test(checkContent);

          // Parse markdown to HTML
          const fullHtml = marked.parse(markdownContent);
          const whyText = extractWhyText(markdownContent);
          const whyHtml = extractWhyHtml(markdownContent);

          manifest.checks[name] = {
            name,
            group,
            description,
            tags,
            hasFix,
            whyText,
            whyHtml,
            fullHtml,
            sourceUrl: frontmatter.sourceUrl || null,
            toolUrl: frontmatter.toolUrl || null,
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
  await fs.mkdir(outputDir, { recursive: true });

  // Write manifest
  await fs.writeFile(outputFile, JSON.stringify(manifest, null, 2));
  console.log(`Written to ${outputFile}`);
}

main().catch((err) => {
  console.error("Failed to compile docs:", err);
  process.exit(1);
});
