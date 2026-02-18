<script lang="ts">
  import FileTree from './FileTree.svelte';
  import { readDirectory, saveVaultPath, selectVaultFolder, type FileNode } from '../lib/tauri';

  let {
    vaultPath,
    selectedFilePath,
    onFileSelect,
    onVaultChange,
  }: {
    vaultPath: string | null;
    selectedFilePath: string | null;
    onFileSelect: (path: string) => void;
    onVaultChange: (path: string) => void;
  } = $props();

  let tree: FileNode[] = $state([]);
  let loading = $state(false);
  let error: string | null = $state(null);

  $effect(() => {
    if (vaultPath) {
      loadTree(vaultPath);
    }
  });

  async function loadTree(path: string) {
    loading = true;
    error = null;
    try {
      tree = await readDirectory(path);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  async function openVault() {
    const path = await selectVaultFolder();
    if (path) {
      await saveVaultPath(path);
      onVaultChange(path);
    }
  }

  function vaultName(path: string): string {
    return path.split('/').filter(Boolean).pop() ?? path;
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <span class="vault-label" title={vaultPath ?? ''}>
      {#if vaultPath}
        {vaultName(vaultPath)}
      {:else}
        No vault
      {/if}
    </span>
    <button class="open-btn" onclick={openVault} title="Open vault folder">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 3.5A1.5 1.5 0 012.5 2h3.379a1.5 1.5 0 011.06.44L8 3.5H13.5A1.5 1.5 0 0115 5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <div class="sidebar-content">
    {#if loading}
      <div class="state-message">Loading...</div>
    {:else if error}
      <div class="state-message error">{error}</div>
    {:else if !vaultPath}
      <div class="state-message">
        <button class="select-vault-btn" onclick={openVault}>
          Open a vault folder
        </button>
      </div>
    {:else if tree.length === 0}
      <div class="state-message">No markdown files found</div>
    {:else}
      <FileTree
        nodes={tree}
        {selectedFilePath}
        {onFileSelect}
      />
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-width);
    min-width: var(--sidebar-width);
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    min-height: 42px;
    gap: 8px;
  }

  .vault-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex: 1;
    min-width: 0;
  }

  .open-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;
  }

  .open-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .state-message {
    padding: 16px;
    color: var(--text-muted);
    font-size: 13px;
  }

  .state-message.error {
    color: #f48771;
    word-break: break-all;
  }

  .select-vault-btn {
    background: var(--accent);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    width: 100%;
    transition: opacity 0.15s;
  }

  .select-vault-btn:hover {
    opacity: 0.85;
  }
</style>
