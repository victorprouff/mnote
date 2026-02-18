<script lang="ts">
  import FileTree from './FileTree.svelte';
  import type { FileNode } from '../lib/tauri';

  let {
    nodes,
    selectedFilePath,
    depth = 0,
    onFileSelect,
  }: {
    nodes: FileNode[];
    selectedFilePath: string | null;
    depth?: number;
    onFileSelect: (path: string) => void;
  } = $props();

  let expanded: Record<string, boolean> = $state({});

  function toggle(path: string) {
    expanded[path] = !expanded[path];
  }
</script>

<ul class="file-list">
  {#each nodes as node (node.path)}
    <li>
      {#if node.is_dir}
        <button
          class="tree-item dir"
          onclick={() => toggle(node.path)}
          style="padding-left: {12 + depth * 14}px"
        >
          <span class="chevron" class:open={expanded[node.path]}>›</span>
          <span class="icon-folder">
            {#if expanded[node.path]}
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 4.5A1.5 1.5 0 012.5 3h3.379a1.5 1.5 0 011.06.44L8 4.5H13.5A1.5 1.5 0 0115 6v6a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12V4.5z" fill="var(--accent)" opacity="0.7"/></svg>
            {:else}
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 4.5A1.5 1.5 0 012.5 3h3.379a1.5 1.5 0 011.06.44L8 4.5H13.5A1.5 1.5 0 0115 6v6a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12V4.5z" stroke="var(--text-muted)" stroke-width="1.2"/></svg>
            {/if}
          </span>
          <span class="name">{node.name}</span>
        </button>

        {#if expanded[node.path] && node.children}
          <FileTree
            nodes={node.children}
            {selectedFilePath}
            depth={depth + 1}
            {onFileSelect}
          />
        {/if}
      {:else}
        <button
          class="tree-item file"
          class:selected={selectedFilePath === node.path}
          onclick={() => onFileSelect(node.path)}
          style="padding-left: {12 + depth * 14}px"
        >
          <span class="chevron invisible">›</span>
          <span class="icon-file">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M10 2v3h3" stroke="currentColor" stroke-width="1.2"/></svg>
          </span>
          <span class="name">{node.name.replace(/\.md$/, '')}</span>
        </button>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .tree-item {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding-top: 3px;
    padding-right: 10px;
    padding-bottom: 3px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-primary);
    font-size: 13px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
  }

  .tree-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .tree-item.selected {
    background: var(--accent);
    color: white;
  }

  .tree-item.selected .icon-file {
    color: white;
  }

  .chevron {
    font-size: 12px;
    width: 12px;
    flex-shrink: 0;
    color: var(--text-muted);
    display: inline-block;
    transition: transform 0.15s;
    transform: rotate(0deg);
    line-height: 1;
    text-align: center;
  }

  .chevron.open {
    transform: rotate(90deg);
  }

  .chevron.invisible {
    visibility: hidden;
  }

  .icon-folder,
  .icon-file {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--text-muted);
  }

  .dir .name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file .name {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
