import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { htmlPage, escapeHtml } from "./template.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const checksDir = join(__dirname, "..", "checks");
const outputDir = join(__dirname, "..", "..", "docs");

interface CheckDoc {
  name: string;
  group: string;
  description: string;
  content: string;
  tags: string[];
  hasFix: boolean;
}

function parseMarkdown(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code: string) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Paragraphs
  html = html
    .split("\n\n")
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (block.startsWith("<")) return block;
      return `<p>${block.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");

  return html;
}

async function findCheckDocs(): Promise<CheckDoc[]> {
  const docs: CheckDoc[] = [];
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

          // Extract name from first h1
          const nameMatch = /^# (.+)$/m.exec(docsContent);
          const name = nameMatch ? nameMatch[1] : item;

          // Extract description (first paragraph after h1)
          const descMatch = /^# .+\n\n(.+?)(\n\n|$)/m.exec(docsContent);
          const description = descMatch ? descMatch[1] : "";

          // Extract tags from check.ts
          const tagsMatch = /tags:\s*\[([^\]]+)\]/.exec(checkContent);
          const tags = tagsMatch
            ? tagsMatch[1].split(",").map((t) => t.trim().replace(/['"]/g, ""))
            : [];

          // Check if fix is available
          const hasFix = /fix:\s*\{/.test(checkContent);

          docs.push({
            name,
            group,
            description,
            content: docsContent,
            tags,
            hasFix,
          });
        } catch {
          // Not a check folder with docs, skip
        }
      }
    } catch {
      // Not a directory, skip
    }
  }

  return docs.sort((a, b) => a.name.localeCompare(b.name));
}

async function generateDocs(): Promise<void> {
  console.log("Generating documentation...");

  const docs = await findCheckDocs();
  console.log(`Found ${docs.length} checks with documentation`);

  await mkdir(outputDir, { recursive: true });

  // Generate individual pages
  for (const doc of docs) {
    const nav = `<nav><a href="index.html">All Checks</a> / ${doc.group}</nav>`;
    const tagsHtml = doc.tags.map((t) => `<span class="tag ${t}">${t}</span>`).join(" ");
    const fixBadge = doc.hasFix ? '<span class="tag fixable">auto-fix</span>' : "";
    const content = `
      <div>${tagsHtml} ${fixBadge}</div>
      ${parseMarkdown(doc.content)}
    `;
    const html = htmlPage(doc.name, content, nav);
    const filename = `${doc.name}.html`;
    await writeFile(join(outputDir, filename), html);
    console.log(`  Generated ${filename}`);
  }

  // Generate index page
  const groupedDocs = new Map<string, CheckDoc[]>();
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
