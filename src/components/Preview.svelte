<script lang="ts">
  import MarkdownIt from 'markdown-it';

  let { content }: { content: string } = $props();

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  let rendered = $state('');

  $effect(() => {
    rendered = md.render(content);
  });
</script>

<div class="preview-container">
  <div class="markdown-body">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html rendered}
  </div>
</div>

<style>
  .preview-container {
    height: 100%;
    overflow-y: auto;
    padding: 48px 64px;
    background: var(--bg-primary);
  }

  .markdown-body {
    max-width: 780px;
    margin: 0 auto;
    color: var(--text-primary);
    line-height: 1.75;
    font-family: Georgia, 'Palatino Linotype', serif;
    font-size: 16px;
  }

  :global(.markdown-body h1),
  :global(.markdown-body h2),
  :global(.markdown-body h3),
  :global(.markdown-body h4),
  :global(.markdown-body h5),
  :global(.markdown-body h6) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e4e4e4;
    margin: 1.6em 0 0.5em;
    line-height: 1.3;
    font-weight: 600;
  }

  :global(.markdown-body h1) { font-size: 2em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
  :global(.markdown-body h2) { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }
  :global(.markdown-body h3) { font-size: 1.25em; }
  :global(.markdown-body h4) { font-size: 1em; }

  :global(.markdown-body p) {
    margin: 0.85em 0;
  }

  :global(.markdown-body a) {
    color: var(--accent);
    text-decoration: none;
  }

  :global(.markdown-body a:hover) {
    text-decoration: underline;
  }

  :global(.markdown-body code) {
    background: var(--bg-tertiary);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.875em;
    color: #ce9178;
  }

  :global(.markdown-body pre) {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px 20px;
    overflow-x: auto;
    margin: 1.2em 0;
  }

  :global(.markdown-body pre code) {
    background: none;
    padding: 0;
    font-size: 0.875em;
    color: var(--text-primary);
  }

  :global(.markdown-body blockquote) {
    border-left: 3px solid var(--accent);
    margin: 1em 0;
    padding: 4px 20px;
    color: var(--text-muted);
    font-style: italic;
  }

  :global(.markdown-body ul),
  :global(.markdown-body ol) {
    margin: 0.85em 0;
    padding-left: 28px;
  }

  :global(.markdown-body li) {
    margin: 0.3em 0;
  }

  :global(.markdown-body li > ul),
  :global(.markdown-body li > ol) {
    margin: 0.2em 0;
  }

  :global(.markdown-body hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 2.5em 0;
  }

  :global(.markdown-body table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1.2em 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 0.9em;
  }

  :global(.markdown-body th),
  :global(.markdown-body td) {
    border: 1px solid var(--border);
    padding: 8px 14px;
    text-align: left;
  }

  :global(.markdown-body th) {
    background: var(--bg-secondary);
    font-weight: 600;
    color: #e4e4e4;
  }

  :global(.markdown-body tr:nth-child(even) td) {
    background: rgba(255, 255, 255, 0.02);
  }

  :global(.markdown-body img) {
    max-width: 100%;
    border-radius: 4px;
  }

  :global(.markdown-body strong) {
    color: #e4e4e4;
    font-weight: 700;
  }

  :global(.markdown-body em) {
    color: #c8c8c8;
  }
</style>
