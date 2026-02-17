import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { htmlPage, escapeHtml } from "./template.js";
import { getAllCompiledDocs, type CompiledCheckDoc } from "./compiled-docs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, "..", "..", "docs");

async function generateDocs(): Promise<void> {
  console.log("Generating documentation...");

  const docs = await getAllCompiledDocs();
  console.log(`Found ${docs.length} checks with documentation`);

  await mkdir(outputDir, { recursive: true });

  // Generate individual pages
  for (const doc of docs) {
    const nav = `<nav><a href="index.html">All Checks</a> / ${doc.group}</nav>`;
    const tagsHtml = doc.tags.map((t) => `<span class="tag ${t}">${t}</span>`).join(" ");
    const fixBadge = doc.hasFix ? '<span class="tag fixable">auto-fix</span>' : "";
    const content = `
      <div>${tagsHtml} ${fixBadge}</div>
      ${doc.fullHtml}
    `;
    const html = htmlPage(doc.name, content, nav);
    const filename = `${doc.name}.html`;
    await writeFile(join(outputDir, filename), html);
    console.log(`  Generated ${filename}`);
  }

  // Generate index page
  const groupedDocs = new Map<string, CompiledCheckDoc[]>();
  for (const doc of docs) {
    const group = groupedDocs.get(doc.group) ?? [];
    group.push(doc);
    groupedDocs.set(doc.group, group);
  }

  let indexContent = "<h1>Project Doctor Checks</h1>\n";
  indexContent += `<p>${docs.length} checks available</p>\n`;

  for (const [group, groupDocs] of groupedDocs) {
    indexContent += `<h2>${group}</h2>\n`;
    indexContent += '<ul class="check-list">\n';
    for (const doc of groupDocs) {
      const tagsHtml = doc.tags.map((t) => `<span class="tag ${t}">${t}</span>`).join(" ");
      const fixBadge = doc.hasFix ? '<span class="tag fixable">auto-fix</span>' : "";
      indexContent += `<li>
        <a href="${doc.name}.html">${doc.name}</a> ${tagsHtml} ${fixBadge}
        <div class="desc">${escapeHtml(doc.description)}</div>
      </li>\n`;
    }
    indexContent += "</ul>\n";
  }

  const indexHtml = htmlPage("Checks", indexContent, "<nav>All Checks</nav>");
  await writeFile(join(outputDir, "index.html"), indexHtml);
  console.log("  Generated index.html");

  console.log(`\nDocs generated in ${outputDir}`);
}

generateDocs().catch(console.error);
