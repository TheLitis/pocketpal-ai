const fs = require('fs');
const path = require('path');
const katex = require('katex');
const {marked} = require('marked');

const OUTPUT_PATH = path.join(
  process.cwd(),
  'build',
  'message-renderer-preview.html',
);

const SAMPLE_MARKDOWN = [
  '# Local rich rendering',
  '',
  'Assistant answers can mix **Markdown**, `inline code`, links, and $E = mc^2$.',
  '',
  '> The renderer keeps broken or partial content readable while a model is streaming.',
  '',
  '- [x] Markdown',
  '- [x] Tables',
  '- [x] Local math',
  '',
  '## Display math',
  '',
  '$$',
  '\\frac{dx}{dt} = \\alpha x + \\beta',
  '$$',
  '',
  '## Table',
  '',
  '| Symbol | Meaning | Status |',
  '|:-------|:--------|-------:|',
  '| $x$ | variable | `ready` |',
  '| $\\beta$ | coefficient | [docs](https://katex.org) |',
  '',
  '## Code',
  '',
  '```python',
  'def solve(rate, value):',
  '    return rate * value  # $not math inside code$',
  '```',
].join('\n');

const THINKING_TEXT =
  'Reasoning is separated from the answer and collapsed by default.';
const TOOL_CALL =
  '{\n  "name": "search",\n  "arguments": {"query": "PocketPal markdown"}\n}';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function localKaTeXCss() {
  return fs
    .readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf8')
    .replace(/@font-face\{[^}]*\}/g, '');
}

function renderMath(source, displayMode) {
  try {
    const html = katex.renderToString(source, {
      displayMode,
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    });

    if (!html.includes('katex-error')) {
      return html;
    }
  } catch {
    // The preview intentionally uses the same visible TeX fallback as the app.
  }

  return `<code class="math-fallback">${escapeHtml(source)}</code>`;
}

function protectCodeFences(markdown) {
  const blocks = [];
  const text = markdown.replace(
    /(^|\n)(`{3,}|~{3,})[\s\S]*?(\n\2(?=\n|$)|$)/g,
    match => {
      const token = `@@PP_CODE_${blocks.length}@@`;
      blocks.push(match);
      return token;
    },
  );

  return {blocks, text};
}

function renderMarkdown(markdown) {
  const protectedMarkdown = protectCodeFences(markdown);
  const math = [];
  const addMath = (source, displayMode) => {
    const token = `@@PP_MATH_${math.length}@@`;
    const className = displayMode ? 'math-block' : 'math-inline';
    math.push(
      `<span class="${className}">${renderMath(source.trim(), displayMode)}</span>`,
    );
    return token;
  };

  let prepared = protectedMarkdown.text
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, source) => addMath(source, true))
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, source) => addMath(source, true))
    .replace(/\\\(([^\n]*?)\\\)/g, (_match, source) => addMath(source, false))
    .replace(
      /(^|[^\\$])\$([^$\n]+?)\$/g,
      (_match, prefix, source) => `${prefix}${addMath(source, false)}`,
    );

  protectedMarkdown.blocks.forEach((block, index) => {
    prepared = prepared.replace(`@@PP_CODE_${index}@@`, block);
  });

  let html = marked.parse(prepared, {breaks: true, gfm: true});
  math.forEach((formula, index) => {
    html = html.replace(`@@PP_MATH_${index}@@`, formula);
  });

  return html;
}

function createPreviewDocument() {
  const katexCss = localKaTeXCss();
  const renderedMarkdown = renderMarkdown(SAMPLE_MARKDOWN);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PocketPal Rich Renderer Preview</title>
  <style>
    ${katexCss}
    :root { color-scheme: light dark; font-family: Arial, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e8edf2; color: #1d2939; }
    body.dark { background: #121920; color: #e7edf5; }
    .toolbar { position: sticky; top: 0; z-index: 1; display: flex; justify-content: space-between; align-items: center; min-height: 56px; padding: 10px max(20px, calc((100vw - 1120px) / 2)); background: #ffffff; border-bottom: 1px solid #cbd5e1; }
    .dark .toolbar { background: #18212b; border-color: #334155; }
    .toolbar strong { font-size: 15px; }
    button { min-height: 34px; padding: 6px 10px; border: 1px solid #64748b; border-radius: 5px; background: transparent; color: inherit; cursor: pointer; }
    main { display: grid; grid-template-columns: minmax(0, 680px) minmax(260px, 360px); gap: 24px; max-width: 1120px; margin: 0 auto; padding: 24px 20px 48px; }
    .chat { min-width: 0; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; }
    .dark .chat { border-color: #334155; background: #17202a; }
    .bubble { min-width: 0; max-width: 100%; padding: 14px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 2px rgba(15, 23, 42, .08); }
    .dark .bubble { background: #202c38; box-shadow: none; }
    .bubble > :first-child { margin-top: 0; }
    .bubble > :last-child { margin-bottom: 0; }
    h1, h2, h3 { line-height: 1.25; margin: 22px 0 10px; }
    h1 { font-size: 24px; } h2 { font-size: 19px; } h3 { font-size: 16px; }
    p, li { font-size: 15px; line-height: 1.55; }
    blockquote { margin: 14px 0; padding: 8px 12px; border-left: 3px solid #3b82f6; color: #475569; background: #eff6ff; }
    .dark blockquote { color: #cbd5e1; background: #1e3a5f; }
    code { font-family: "JetBrains Mono", Consolas, monospace; font-size: .9em; padding: 2px 4px; border-radius: 3px; background: #e2e8f0; }
    .dark code { background: #334155; }
    pre { overflow-x: auto; padding: 12px; border-radius: 6px; background: #111827; color: #e5e7eb; }
    pre code { padding: 0; background: transparent; }
    table { display: block; width: max-content; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 12px 0; }
    th, td { min-width: 112px; padding: 8px; border: 1px solid #cbd5e1; text-align: left; vertical-align: top; }
    .dark th, .dark td { border-color: #475569; }
    th { background: #f1f5f9; } .dark th { background: #334155; }
    .math-inline { display: inline-block; vertical-align: -0.15em; }
    .math-block { display: block; overflow-x: auto; margin: 14px 0; padding: 8px 2px; text-align: center; }
    .math-block .katex-display { margin: 0; min-width: max-content; }
    .katex, .katex * { font-family: "Cambria Math", "Times New Roman", serif !important; }
    .thinking, .structured { margin-top: 12px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .dark .thinking, .dark .structured { border-color: #475569; }
    summary, .structured header { min-height: 36px; padding: 9px 10px; font-size: 13px; font-weight: 700; background: #f1f5f9; cursor: pointer; }
    .dark summary, .dark .structured header { background: #334155; }
    .thinking p { margin: 10px; color: #64748b; } .dark .thinking p { color: #cbd5e1; }
    .structured pre { margin: 0; border-radius: 0; }
    aside { align-self: start; font-size: 14px; line-height: 1.5; color: #475569; }
    .dark aside { color: #cbd5e1; }
    aside h2 { margin-top: 0; }
    @media (max-width: 780px) { main { grid-template-columns: minmax(0, 1fr); padding: 16px; } aside { order: -1; min-width: 0; overflow-wrap: anywhere; } table { width: 100%; table-layout: fixed; } th, td { min-width: 0; overflow-wrap: anywhere; } }
  </style>
</head>
<body>
  <header class="toolbar"><strong>PocketPal rich renderer preview</strong><button id="theme-toggle" type="button">Toggle theme</button></header>
  <main>
    <section class="chat" aria-label="Assistant message preview"><article class="bubble">${renderedMarkdown}<details class="thinking"><summary>Thinking</summary><p>${escapeHtml(THINKING_TEXT)}</p></details><section class="structured"><header>Tool call <code>json</code></header><pre><code>${escapeHtml(TOOL_CALL)}</code></pre></section></article></section>
    <aside><h2>Local preview</h2><p>This file is generated from local dependencies. It has no external scripts, fonts, images, or network requests.</p><p>Use it to inspect Markdown, code overflow, tables, local KaTeX output, dark mode, and compact mobile-width layout on a desktop browser.</p><p>Regenerate with <code>corepack yarn preview:renderer</code>.</p></aside>
  </main>
  <script>document.getElementById('theme-toggle').addEventListener('click', function () { document.body.classList.toggle('dark'); });</script>
</body>
</html>`;
}

function writePreview(outputPath = OUTPUT_PATH) {
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, createPreviewDocument());
  return outputPath;
}

if (require.main === module) {
  const outputPath = writePreview(process.argv[2] || OUTPUT_PATH);
  console.log(`Generated ${outputPath}`);
}

module.exports = {
  createPreviewDocument,
  renderMarkdown,
  renderMath,
  writePreview,
};
