/**
 * Runtime loader for compiled docs manifest.
 *
 * This module loads the pre-compiled docs-manifest.json that was generated
 * at build time by scripts/compile-docs.js.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CheckTag } from "../types.js";
import { safeJsonParse } from "../utils/safe-json.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve manifest path relative to project root (works from both src/ and dist/)
// From src/docs or dist/docs, go up 2 levels to project root, then into dist/
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "dist", "docs-manifest.json");

export interface CompiledCheckDoc {
  name: string;
  group: string;
  description: string;
  tags: CheckTag[];
  hasFix: boolean;
  whyText: string | null;
  whyHtml: string | null;
  fullHtml: string;
  sourceUrl: string | null;
  toolUrl: string | null;
}

export interface DocsManifest {
  generatedAt: string;
  checks: Record<string, CompiledCheckDoc>;
}

// In-memory cache for manifest
let cachedManifest: DocsManifest | null = null;

/**
 * Load the docs manifest, caching it after first load.
 */
export async function loadDocsManifest(): Promise<DocsManifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    const content = await readFile(MANIFEST_PATH, "utf8");
    const parsed = safeJsonParse<DocsManifest>(content);
    if (!parsed) {
      return { generatedAt: "", checks: {} };
    }
    cachedManifest = parsed;
    return cachedManifest;
  } catch {
    // Return empty manifest if file doesn't exist (e.g., during development)
    return {
      generatedAt: "",
      checks: {},
    };
  }
}

/**
 * Get the "Why" text for a check (plain text format).
 *
 * @param checkName - Name of the check
 * @returns The "Why" section text, or null if not found
 */
export async function getWhyText(checkName: string): Promise<string | null> {
  const manifest = await loadDocsManifest();
  const doc = manifest.checks[checkName];
  return doc?.whyText ?? null;
}

/**
 * Get the "Why" HTML for a check.
 *
 * @param checkName - Name of the check
 * @returns The "Why" section as HTML, or null if not found
 */
export async function getWhyHtml(checkName: string): Promise<string | null> {
  const manifest = await loadDocsManifest();
  const doc = manifest.checks[checkName];
  return doc?.whyHtml ?? null;
}

/**
 * Get the source URL for a check (from frontmatter).
 */
export async function getSourceUrl(checkName: string): Promise<string | null> {
  const manifest = await loadDocsManifest();
  const doc = manifest.checks[checkName];
  return doc?.sourceUrl ?? null;
}

/**
 * Get the tool documentation URL for a check (from frontmatter).
 */
export async function getToolUrl(checkName: string): Promise<string | null> {
  const manifest = await loadDocsManifest();
  const doc = manifest.checks[checkName];
  return doc?.toolUrl ?? null;
}

/**
 * Get all compiled docs for HTML generation.
 *
 * @returns Array of all compiled check docs, sorted by name
 */
export async function getAllCompiledDocs(): Promise<CompiledCheckDoc[]> {
  const manifest = await loadDocsManifest();
  return Object.values(manifest.checks).toSorted((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single compiled doc by check name.
 *
 * @param checkName - Name of the check
 * @returns The compiled doc, or null if not found
 */
export async function getCompiledDoc(checkName: string): Promise<CompiledCheckDoc | null> {
  const manifest = await loadDocsManifest();
  return manifest.checks[checkName] ?? null;
}
