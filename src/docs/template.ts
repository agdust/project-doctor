export function htmlPage(title: string, content: string, nav: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Project Doctor</title>
  <style>
    :root {
      --bg: #fff;
      --fg: #1a1a1a;
      --fg-muted: #666;
      --border: #e5e5e5;
      --accent: #2563eb;
      --code-bg: #f5f5f5;
      --pass: #16a34a;
      --fail: #dc2626;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1a1a;
        --fg: #e5e5e5;
        --fg-muted: #999;
        --border: #333;
        --accent: #60a5fa;
        --code-bg: #2d2d2d;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: var(--fg);
      background: var(--bg);
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    header a {
      color: var(--accent);
      text-decoration: none;
    }
    nav {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--fg-muted);
    }
    nav a { color: var(--accent); }
    h1 { font-size: 2rem; margin-top: 0; }
    h2 { font-size: 1.25rem; margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    code {
      background: var(--code-bg);
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-size: 0.875em;
    }
    pre {
      background: var(--code-bg);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    ul { padding-left: 1.5rem; }
    a { color: var(--accent); }
    .tag {
      display: inline-block;
      background: #e5e5e5;
      color: #666;
      padding: 0.125rem 0.5rem;
      border-radius: 3px;
      font-size: 0.75rem;
      margin-right: 0.25rem;
    }
    .tag.required { background: #1a1a1a; color: #fff; }
    .tag.recommended { background: #dcfce7; color: #166534; }
    .tag.opinionated { background: #fce7f3; color: #9d174d; }
    .tag.fixable { background: #dbeafe; color: #1e40af; }
    @media (prefers-color-scheme: dark) {
      .tag { background: #404040; color: #999; }
      .tag.required { background: #e5e5e5; color: #1a1a1a; }
      .tag.recommended { background: #166534; color: #dcfce7; }
      .tag.opinionated { background: #9d174d; color: #fce7f3; }
      .tag.fixable { background: #1e40af; color: #dbeafe; }
    }
    .check-list { list-style: none; padding: 0; }
    .check-list li { padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
    .check-list a { text-decoration: none; }
    .check-list .desc { color: var(--fg-muted); font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1><a href="index.html">Project Doctor</a></h1>
      ${nav}
    </header>
    <main>
      ${content}
    </main>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS.
 *
 * IMPORTANT: The order of replacements matters!
 * Ampersand (&) must be escaped first, otherwise we'd double-escape
 * the ampersands in &lt; &gt; etc.
 */
export function escapeHtml(str: string): string {
  return str
    .replaceAll('&', "&amp;") // Must be first to avoid double-escaping
    .replaceAll('<', "&lt;")
    .replaceAll('>', "&gt;")
    .replaceAll('"', "&quot;");
}
